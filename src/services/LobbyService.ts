import { BadRequest, Forbidden, InternalServerError, NotFound } from '@models/ErrorModels'
import { CharacterDataEditable } from '@models/GameEditorModels'
import { LobbyInfo } from '@models/InfoModels'
import { AttributeInfo } from '@models/ServerModels'
import { TranslationSnippet } from '@models/Translation'
import { AttributeClass, CombatClass } from '@models/TypegooseModels'
import { CombatSaveType } from '@schemas/CombatSaveSchema'
import { Types } from 'mongoose'
import { Socket } from 'socket.io'
import AuthService from './AuthService'
import CombatManager from './CombatManager'
import DatabaseService from './DatabaseService'
import GameConversionService from './GameConversionService'

class LobbyService {
    private managingCombats: Map<string, Array<string>> = new Map()

    public createNewLobby(name: string, gm_id: string): Promise<Types.ObjectId> {
        return DatabaseService.createNewLobby(name, gm_id)
    }

    public createCombat(
        lobby_id: string,
        nickname: string,
        preset: CombatSaveType,
        gm_id: string,
        players: string[]
    ): string | null {
        this.managingCombats.set(lobby_id, this.managingCombats.get(lobby_id) || [])
        const combats = this.managingCombats.get(lobby_id)
        if (combats) {
            const combatId = CombatManager.createCombat(nickname, preset, gm_id, players, () => {
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

    public async getFullLobbyInfo(lobby_id: string, userId: string): Promise<LobbyInfo> {
        const lobby = await DatabaseService.getLobby(lobby_id)
        if (!lobby) {
            throw new NotFound('Lobby not found')
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
                        nickname: combat?.nickname || '',
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
            const controlledCharacters = await DatabaseService.getCharacterDescriptorsOfPlayer(lobby_id, p.userId)
            players.push({
                handle: player?.handle || '',
                userId: p.userId,
                nickname: p.nickname,
                characters: controlledCharacters || [],
                avatar: player?.avatar || {
                    preferred: 'static',
                    url: '',
                    generated: {
                        pattern: '',
                        mainColor: '',
                        secondaryColor: '',
                    },
                },
            })
        }
        const characters = []
        for (const { characterId } of lobby.characterBank) {
            const character = await DatabaseService.getCharacter(characterId)
            if (!character) throw new NotFound('Character not found')
            characters.push({
                descriptor: character.descriptor,
                decorations: {
                    name: character.decorations?.name || '',
                    description: character.decorations?.description || '',
                    sprite: character.decorations?.sprite || '',
                },
            })
        }
        return {
            name: lobby.name,
            lobbyId: lobby_id,
            combats: combatInfo || [],
            players,
            characters,
            gm: lobby.gm_id,
            layout: userId === lobby.gm_id ? 'gm' : 'default',
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

    public async getMyCharactersInfo(lobby_id: string, player_id: string): Promise<Array<CharacterDataEditable>> {
        const controlledCharacters = await DatabaseService.getCharactersOfPlayer(lobby_id, player_id)
        return controlledCharacters.map((character) => GameConversionService.convertCharacterModelToEditable(character))
    }

    public async getCharacterInfo(
        lobby_id: string,
        user_id: string,
        descriptor: string
    ): Promise<CharacterDataEditable> {
        const lobby = await DatabaseService.getLobby(lobby_id)
        if (!lobby) throw new NotFound('Lobby not found')
        if (!lobby.characterBank) throw new InternalServerError('Character bank not found')
        if (!lobby.players.find((p) => p.userId === user_id)) {
            throw new Forbidden('You are not a player in this lobby')
        }
        const character = await DatabaseService.getCharacterByDescriptor(descriptor)
        if (!character) throw new NotFound('Character not found')
        return GameConversionService.convertCharacterModelToEditable(character)
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
        const character_id = await DatabaseService.createNewCharacter(descriptor, decorations, attributes)
        await DatabaseService.addCharacterToLobby(lobby_id, character_id.toString(), controlledBy)
        return character_id
    }

    async deleteCharacter(lobby_id: string, descriptor: string): Promise<void> {
        const character = await DatabaseService.getCharacterByDescriptor(descriptor)
        if (!character) throw new NotFound('Character not found')
        const lobby = await DatabaseService.getLobby(lobby_id)
        if (!lobby) throw new NotFound('Lobby not found')
        if (!lobby.characterBank) throw new InternalServerError('Character bank not found')
        if (!lobby.characterBank.find((c) => c.characterId.toString() === character._id.toString())) {
            throw new NotFound('Character not found in this lobby')
        }
        await DatabaseService.deleteCharacter(character._id)
    }

    public createNewCombatPreset = async (field: CombatClass['field']): Promise<Types.ObjectId> => {
        const occupiedSquares: Array<string> = []
        for (const pawn of field) {
            if (occupiedSquares.includes(pawn.square)) throw new BadRequest('Multiple pawns on the same square')
            occupiedSquares.push(pawn.square)
        }
        return await DatabaseService.createNewCombatPreset(field)
    }

    public getShortLobbyInfo = async (lobbyId: string, userId: string) => {
        const lobby = await DatabaseService.getLobby(lobbyId)
        if (!lobby) throw new NotFound('Lobby not found')
        const { name, gm_id } = lobby
        if (!lobbyId || !name || !gm_id) throw new InternalServerError()
        const characters = []
        for (const { controlledBy, characterId } of lobby.characterBank) {
            if (controlledBy.includes(userId)) {
                const character = await DatabaseService.getCharacter(characterId)
                if (!character) throw new NotFound('Character not found')
                if (character.decorations?.name) characters.push(character.decorations.name)
                else if (character.descriptor) characters.push(`${character.descriptor}.name`)
            }
        }

        return {
            _id: lobbyId,
            name,
            isGm: gm_id.toString() === userId,
            characters,
        }
    }

    public getCustomTranslations = async (lobby_id: string, user_id: string): Promise<TranslationSnippet> => {
        const lobby = await DatabaseService.getLobby(lobby_id)
        if (!lobby) throw new NotFound('Lobby not found')
        if (!lobby.players.find((p) => p.userId === user_id)) {
            throw new Forbidden('You are not a player in this lobby')
        }
        const characters = await DatabaseService.getCharactersOfLobby(lobby_id)
        const res: TranslationSnippet = {}
        for (const character of characters) {
            if (character.decorations?.name)
                res[character.descriptor] = {
                    name: character.decorations.name,
                    desc: character.decorations.description,
                }
            else if (character.descriptor) {
                res[character.descriptor] = {
                    name: `${character.descriptor}.name`,
                    desc: `${character.descriptor}.desc`,
                }
            } else {
                throw new InternalServerError(
                    'Character is missing both descriptor and decorations! Report this issue to the developers. Sorry for the inconvenience!'
                )
            }
        }
        return res
    }

    public async getWeaponryOfCharacter(
        lobbyId: string,
        descriptor: string
    ): Promise<CharacterDataEditable['weaponry']> {
        const lobby = await DatabaseService.getLobby(lobbyId)
        if (!lobby) throw new NotFound('Lobby not found')
        const character = await DatabaseService.getCharacterByDescriptor(descriptor)
        if (!character) throw new NotFound('Character not found')
        const { weaponry: databaseWeaponry } = character
        return GameConversionService.convertWeaponry(databaseWeaponry)
    }

    public async getInventoryOfCharacter(
        lobbyId: string,
        descriptor: string
    ): Promise<CharacterDataEditable['inventory']> {
        const lobby = await DatabaseService.getLobby(lobbyId)
        if (!lobby) throw new NotFound('Lobby not found')
        const character = await DatabaseService.getCharacterByDescriptor(descriptor)
        if (!character) throw new NotFound('Character not found')
        const { inventory: databaseInventory } = character
        return GameConversionService.convertInventory(databaseInventory)
    }

    public async getStatusEffectsOfCharacter(
        lobbyId: string,
        descriptor: string
    ): Promise<CharacterDataEditable['statusEffects']> {
        const lobby = await DatabaseService.getLobby(lobbyId)
        if (!lobby) throw new NotFound('Lobby not found')
        const character = await DatabaseService.getCharacterByDescriptor(descriptor)
        if (!character) throw new NotFound('Character not found')
        const { statusEffects: databaseEffects } = character
        return GameConversionService.convertStatusEffects(databaseEffects)
    }

    public async getSpellbookOfCharacter(
        lobbyId: string,
        descriptor: string
    ): Promise<CharacterDataEditable['spellBook']> {
        const lobby = await DatabaseService.getLobby(lobbyId)
        if (!lobby) throw new NotFound('Lobby not found')
        const character = await DatabaseService.getCharacterByDescriptor(descriptor)
        if (!character) throw new NotFound('Character not found')
        return GameConversionService.convertSpellbook(character.spellBook)
    }

    public async getAttributesOfCharacter(lobbyId: string, descriptor: string): Promise<AttributeInfo> {
        const lobby = await DatabaseService.getLobby(lobbyId)
        if (!lobby) throw new NotFound('Lobby not found')
        const character = await DatabaseService.getCharacterByDescriptor(descriptor)
        if (!character) throw new NotFound('Character not found')
        return GameConversionService.convertAttributesFromModel(character)
    }

    public addCharacterToLobby = async (
        lobbyId: string,
        characterDescriptor: string,
        controlledBy: Array<string>
    ): Promise<void> => {
        return await DatabaseService.addCharacterToLobbyByDescriptor(lobbyId, characterDescriptor, controlledBy)
    }

    public addWeaponToCharacter = async (
        lobby_id: string,
        characterDescriptor: string,
        weaponDescriptor: string,
        quantity: number
    ): Promise<void> => {
        return await DatabaseService.addWeaponToCharacter(lobby_id, characterDescriptor, weaponDescriptor, quantity)
    }

    public addSpellToCharacter = async (
        lobby_id: string,
        characterDescriptor: string,
        spellDescriptor: string
    ): Promise<void> => {
        return await DatabaseService.addSpellToCharacter(lobby_id, characterDescriptor, spellDescriptor)
    }

    public addStatusEffectToCharacter = async (
        lobby_id: string,
        characterDescriptor: string,
        effectDescriptor: string,
        duration: number
    ): Promise<void> => {
        return await DatabaseService.addStatusEffectToCharacter(
            lobby_id,
            characterDescriptor,
            effectDescriptor,
            duration
        )
    }

    public addItemToCharacter = async (
        lobby_id: string,
        characterDescriptor: string,
        itemDescriptor: string,
        quantity: number
    ): Promise<void> => {
        return await DatabaseService.addItemToCharacter(lobby_id, characterDescriptor, itemDescriptor, quantity)
    }

    public addAttributeToCharacter = async (
        lobby_id: string,
        characterDescriptor: string,
        dlc: string,
        attributeDescriptor: string,
        value: number
    ): Promise<void> => {
        return await DatabaseService.addAttributeToCharacter(
            lobby_id,
            characterDescriptor,
            dlc,
            attributeDescriptor,
            value
        )
    }
}

export default new LobbyService()
