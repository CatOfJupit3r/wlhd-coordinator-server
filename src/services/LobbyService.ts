import { Socket } from 'socket.io'
import { BadRequest, NotFound } from '../models/ErrorModels'
import { CharacterInfo, LobbyInfo } from '../models/InfoModels'
import { EntityClass } from '../models/entityModel'
import { LobbyClass } from '../models/lobbyModel'
import AuthService from './AuthService'
import CombatManager from './CombatManager'
import DatabaseService from './DatabaseService'

class LobbyService {
    private managingCombats: Map<string, Array<string>> = new Map()

    public getActiveCombats(lobby_id: string): string[] {
        return this.managingCombats.get(lobby_id) || []
    }

    public createCombat(
        lobby_id: string,
        combatNickname: string,
        preset: any,
        gm_id: string,
        players: string[]
    ): string | null {
        this.managingCombats.set(lobby_id, this.managingCombats.get(lobby_id) || [])
        const combats = this.managingCombats.get(lobby_id)
        if (combats) {
            const combatId = CombatManager.createCombat(combatNickname, preset, gm_id, players, () => {
                const index = combats.indexOf(combatId)
                if (index !== -1) {
                    combats.splice(index, 1)
                }
            })
            combats.push(combatId)
            return combatId
        }
        return null
    }

    public async getLobbyInfo(lobby_id: string, user: any, player: any): Promise<LobbyInfo> {
        const combatInfo = []
        const combats = this.managingCombats.get(lobby_id)
        if (combats) {
            for (const combat_id in combats) {
                const combat = CombatManager.get(combat_id)
                if (combat) {
                    combatInfo.push({
                        nickname: combat?.combatNickname || '',
                        isActive: combat?.isActive() || false,
                        roundCount: combat?.isActive() ? combat?.getRoundCount() : 0,
                        _id: combat_id || '',
                        activePlayers: CombatManager.getPlayersInCombat(combat),
                    })
                }
            }
        }
        let name = ''
        let _id: string | null = null
        if (player.mainCharacter) {
            const entity = await DatabaseService.getEntity(player.mainCharacter)
            if (entity) {
                name = entity.descriptor
                _id = player.mainCharacter
            } else {
                name = 'Character not found'
                _id = ''
            }
        }
        const lobby = await DatabaseService.getLobby(lobby_id)
        if (!lobby) {
            return {
                lobbyId: lobby_id,
                combats: combatInfo || [],
                gm: '',
                players: [],
                layout: 'default',
                controlledEntity: null,
            }
        }
        const getCharacter = async (characterId: string) => {
            const entity = await DatabaseService.getEntity(characterId)
            if (!entity) {
                return null
            }
            return {
                name: entity.decorations?.name || `${entity.descriptor}.name`,
                sprite: entity.decorations?.sprite || `${entity.descriptor}.sprite`,
            }
        }
        const players = []
        for (const p of lobby.players) {
            const character = p.characterId ? await getCharacter(p.characterId) : null
            const player = await DatabaseService.getUser(p.userId)
            players.push({
                player: { handle: player?.handle || '', avatar: '', userId: p.userId, nickname: p.nickname },
                character,
            })
        }
        return {
            lobbyId: lobby_id,
            combats: combatInfo || [],
            gm: lobby.gm_id,
            players,
            layout: user._id === lobby.gm_id ? 'gm' : 'default',
            controlledEntity: _id ? { name, id: _id } : null,
        }
    }

    public async addPlayerToLobby(
        lobby_id: string,
        player_id: string,
        nickname: string,
        mainCharacter: string
    ): Promise<void> {
        await DatabaseService.addPlayerToLobby(lobby_id, player_id, nickname, mainCharacter)
    }

    public manageSocket(socket: Socket, combat_id: string, userToken: string): void {
        const combat = CombatManager.get(combat_id)
        if (!combat) {
            console.log('Combat not found')
            return this.disconnectSocket(socket)
        }
        let user_id: string
        try {
            const { _id } = AuthService.verifyAccessToken(userToken)
            user_id = _id
        } catch (e) {
            socket.emit('invalid_token')
            console.log('Error verifying token')
            return this.disconnectSocket(socket)
        }
        if (combat.isPlayerInCombat(user_id)) {
            console.log('Player is in combat')
            return this.disconnectSocket(socket)
        }
        combat.handlePlayer(user_id, socket)
    }

    private disconnectSocket(socket: Socket): void {
        socket.disconnect()
    }

    public async getMyCharacterInfo(lobby_id: string, player_id: string): Promise<CharacterInfo> {
        const lobby = await DatabaseService.getLobby(lobby_id)
        if (!lobby) throw new NotFound('Lobby not found')
        const player = lobby.players.find((p) => p.userId === player_id)
        if (!player) throw new NotFound('Player not found')
        if (!player.characterId) throw new BadRequest('Player has no character')
        const character = await DatabaseService.getCharacterInfo(player.characterId)
        return this.parseEntityClass(character, lobby, player.characterId)
    }

    public async getCharacterInfo(lobby_id: string, character_id: string): Promise<CharacterInfo> {
        const lobby = await DatabaseService.getLobby(lobby_id)
        if (!lobby) throw new NotFound('Lobby not found')
        const character = await DatabaseService.getCharacterInfo(character_id)
        return this.parseEntityClass(character, lobby, character_id)
    }

    private parseEntityClass(character: EntityClass, lobby: LobbyClass, character_id: string | null): CharacterInfo {
        let new_obj: { [key: string]: any } = {}
        for (const [key, atr] of Object.entries(character.attributes)) {
            if (key !== '_doc') continue
            new_obj = { ...atr, _id: undefined }
        }
        console.log(new_obj)
        return {
            ...(character as any)._doc,
            attributes: {
                ...Object.entries(new_obj).reduce((acc: { [key: string]: string }, [key, value]) => {
                    acc[`builtins:${key}`] = String(value) // Convert number to string
                    return acc
                }, {}),
                ...character.customAttributes.reduce((acc: { [key: string]: string }, value: any) => {
                    acc[`${value.dlc}:${value.descriptor}`] = String(value.value) // Convert number to string
                    return acc
                }, {}),
            },
            controlledBy: character_id
                ? lobby.players.find((p) => p.characterId === character_id)?.userId || null
                : null,
        }
    }
}

export default new LobbyService()
