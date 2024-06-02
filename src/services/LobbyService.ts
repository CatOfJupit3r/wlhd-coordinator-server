import { Types } from 'mongoose'
import { Socket } from 'socket.io'
import { BadRequest, InternalServerError, NotFound, Unauthorized } from '../models/ErrorModels'
import { CharacterInfo, LobbyInfo } from '../models/InfoModels'
import { TranslationSnippet } from '../models/Translation'
import { AttributeClass, LobbyModel } from '../models/TypegooseModels'
import { characterModelToInfo } from '../utils/characterConverters'
import AuthService from './AuthService'
import CombatManager from './CombatManager'
import DatabaseService from './DatabaseService'

class LobbyService {
    private managingCombats: Map<string, Array<string>> = new Map()

    public createNewLobby(name: string, gm_id: string): Promise<Types.ObjectId> {
        return DatabaseService.createNewLobby(name, gm_id)
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
        const lobby = await DatabaseService.getLobby(lobby_id)
        if (!lobby) {
            return {
                name: 'Lobby not found',
                lobbyId: lobby_id,
                combats: [],
                gm: '',
                players: [],
                layout: 'default',
                controlledEntity: null,
            }
        }
        const combatInfo = []
        const combats = this.managingCombats.get(lobby_id)
        if (combats) {
            for (const combat_id in combats) {
                const combat = CombatManager.get(combat_id)
                if (combat) {
                    const playerIds = (await CombatManager.getPlayersInCombat(combat)) || []
                    const activePlayers = playerIds.map(async (playerId) => {
                        const userInDB = await DatabaseService.getUser(playerId)
                        return {
                            handle: userInDB?.handle || '',
                            nickname: lobby.players.find((p) => p.userId === playerId)?.nickname || '',
                        }
                    })
                    combatInfo.push({
                        nickname: combat?.combatNickname || '',
                        isActive: combat?.isActive() || false,
                        roundCount: combat?.isActive() ? combat?.getRoundCount() : 0,
                        _id: combat_id || '',
                        activePlayers: await Promise.all(activePlayers),
                    })
                }
            }
        }
        const players = []
        for (const p of lobby.players) {
            const player = await DatabaseService.getUser(p.userId)
            const controlledCharacters = await DatabaseService.getCharactersOfPlayer(lobby_id, p.userId)
            players.push({
                player: { handle: player?.handle || '', avatar: '', userId: p.userId, nickname: p.nickname },
                characters: controlledCharacters.map((character) => character.decorations) || [],
            })
        }
        return {
            name: lobby.name,
            lobbyId: lobby_id,
            combats: combatInfo || [],
            gm: lobby.gm_id,
            players,
            layout: user._id === lobby.gm_id ? 'gm' : 'default',
            controlledEntity: null,
        }
    }

    public async addPlayerToLobby(lobby_id: string, player_id: string, nickname: string): Promise<void> {
        await DatabaseService.addPlayerToLobby(lobby_id, player_id, nickname)
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

    public async getMyCharactersInfo(lobby_id: string, player_id: string): Promise<Array<CharacterInfo>> {
        const controlledCharacters = await DatabaseService.getCharactersOfPlayer(lobby_id, player_id)
        return controlledCharacters.map(characterModelToInfo)
    }

    public async getCharacterInfo(lobby_id: string, character_id: string): Promise<CharacterInfo> {
        const lobby = await DatabaseService.getLobby(lobby_id)
        if (!lobby) throw new NotFound('Lobby not found')
        if (!lobby.characterBank) throw new InternalServerError('Character bank not found')
        const characterIsInBank = lobby.characterBank.find((c) => c.characterId === character_id)
        if (!characterIsInBank) throw new Unauthorized('You cannot search for this character')
        const character = await DatabaseService.getCharacter(character_id)
        if (!character) throw new NotFound('Character not found')
        return characterModelToInfo(character)
    }

    async createNewCharacter(
        lobby_id: string,
        controlledBy: Array<string>,
        descriptor: string,
        decorations: {
            name: string
            description: string
            sprite: string
        },
        attributes: Array<AttributeClass>
    ): Promise<Types.ObjectId> {
        const entity_id = await DatabaseService.createNewCharacter(descriptor, decorations, attributes)
        await DatabaseService.addCharacterToLobby(lobby_id, entity_id.toString(), controlledBy)
        return entity_id
    }

    public createNewCombatPreset = async (
        field: Array<{
            path: string
            square: string
            source: 'embedded' | 'dlc'
            controlled_by: {
                type: 'player' | 'ai' | 'game_logic'
                id: string | null
            }
        }>
    ): Promise<Types.ObjectId> => {
        const occupiedSquares: Array<string> = []
        for (const pawn of field) {
            if (occupiedSquares.includes(pawn.square)) throw new BadRequest('Multiple pawns on the same square')
            occupiedSquares.push(pawn.square)
        }
        return await DatabaseService.createNewCombatPreset(field)
    }

    public getJoinedLobbiesInfo = async (
        userId: string
    ): Promise<Array<{ name: string; isGm: boolean; _id: string }>> => {
        const res: Array<{ name: string; isGm: boolean; _id: string; characters: Array<string> }> = []
        const lobbies = await LobbyModel.find({ 'players.userId': userId })
        for (const lobby of lobbies) {
            const { _id, name, gm_id } = lobby
            if (!_id || !name || !gm_id) throw new InternalServerError()
            const characters = []
            for (const characterInLobby of lobby.characterBank) {
                if (characterInLobby.controlledBy.includes(userId)) {
                    const character = await DatabaseService.getCharacter(characterInLobby.characterId)
                    if (!character) throw new NotFound('Character not found')
                    if (character.decorations?.name) characters.push(character.decorations.name)
                    else if (character.descriptor) characters.push(`${character.descriptor}.name`)
                }
            }

            res.push({
                _id: _id.toString(),
                name,
                isGm: gm_id.toString() === userId,
                characters,
            })
        }
        return res
    }

    public getCustomTranslations = async (lobby_id: string, user_id: string): Promise<TranslationSnippet> => {
        const lobby = await DatabaseService.getLobby(lobby_id)
        if (!lobby) throw new NotFound('Lobby not found')
        if (!lobby.players.find((p) => p.userId === user_id)) {
            throw new Unauthorized('You are not a player in this lobby')
        }
        const characters = await DatabaseService.getCharactersOfLobby(lobby_id)
        const res: TranslationSnippet = {}
        for (const character of characters) {
            if (character.decorations?.name)
                res[character.descriptor] = {
                    name: character.decorations.name,
                    description: character.decorations.description,
                }
            else if (character.descriptor) {
                res[character.descriptor] = {
                    name: `${character.descriptor}.name`,
                    description: `${character.descriptor}.description`,
                }
            } else {
                throw new InternalServerError(
                    'Character is missing both descriptor and decorations! Report this issue to the developers. Sorry for the inconvenience!'
                )
            }
        }
        return res
    }

    public assignCharacterToPlayer = async (lobbyId: string, userId: string, characterId: string): Promise<void> => {
        return await DatabaseService.assignCharacterToPlayer(lobbyId, userId, characterId)
    }

    public removeCharacterFromPlayer = async (lobbyId: string, userId: string, characterId: string): Promise<void> => {
        return await DatabaseService.removeCharacterFromPlayer(lobbyId, userId, characterId)
    }

    public addCharacterToLobby = async (
        lobbyId: string,
        characterId: string,
        controlledBy: Array<string>
    ): Promise<void> => {
        return await DatabaseService.addCharacterToLobby(lobbyId, characterId, controlledBy)
    }

    public addWeaponToCharacter = async (
        lobby_id: string,
        character_id: string,
        descriptor: string,
        quantity: number
    ): Promise<void> => {
        return await DatabaseService.addWeaponToCharacter(lobby_id, character_id, descriptor, quantity)
    }

    public addSpellToCharacter = async (
        lobby_id: string,
        character_id: string,
        descriptor: string,
        conflictsWith: Array<string>,
        requiresToUse: Array<string>
    ): Promise<void> => {
        return await DatabaseService.addSpellToCharacter(
            lobby_id,
            character_id,
            descriptor,
            conflictsWith,
            requiresToUse
        )
    }

    public addStatusEffectToCharacter = async (
        lobby_id: string,
        character_id: string,
        descriptor: string,
        duration: number
    ): Promise<void> => {
        return await DatabaseService.addStatusEffectToCharacter(lobby_id, character_id, descriptor, duration)
    }

    public addItemToCharacter = async (
        lobby_id: string,
        character_id: string,
        descriptor: string,
        quantity: number
    ): Promise<void> => {
        return await DatabaseService.addItemToCharacter(lobby_id, character_id, descriptor, quantity)
    }

    public addAttributeToCharacter = async (
        lobby_id: string,
        character_id: string,
        dlc: string,
        descriptor: string,
        value: number
    ): Promise<void> => {
        return await DatabaseService.addAttributeToCharacter(lobby_id, character_id, dlc, descriptor, value)
    }

    public changeSpellLayoutOfCharacter = async (
        lobby_id: string,
        character_id: string,
        spells: Array<string>
    ): Promise<void> => {
        return await DatabaseService.changeSpellLayoutOfCharacter(lobby_id, character_id, spells)
    }
}

export default new LobbyService()
