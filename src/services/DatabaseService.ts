import { DocumentType } from '@typegoose/typegoose'
import mongoose, { Types } from 'mongoose'
import { DESCRIPTOR_NO_DLC_REGEX } from '../configs'
import { BadRequest, InternalServerError, NotFound } from '../models/ErrorModels'
import {
    AttributeClass,
    CharacterClass,
    CharacterModel,
    CombatClass,
    CombatModel,
    LobbyClass,
    LobbyModel,
    UserClass,
    UserModel,
} from '../models/TypegooseModels'

type SupportedDocumentTypes =
    | DocumentType<LobbyClass>
    | DocumentType<UserClass>
    | DocumentType<CombatClass>
    | DocumentType<CharacterClass>

class DatabaseService {
    public connect = async (): Promise<void> => {
        await mongoose.connect('mongodb://localhost:27017/gameDB')
    }

    private saveDocument = async (document: SupportedDocumentTypes) => {
        try {
            await document.save({
                validateBeforeSave: true,
            })
        } catch (e) {
            console.log(`Validation failed for creation of ${document.baseModelName}`, e)
            throw new InternalServerError()
        }
    }

    public getLobby = async (lobbyId: string): Promise<LobbyClass | null> => {
        if (!lobbyId) {
            return null
        }
        return LobbyModel.findOne({ _id: new Types.ObjectId(lobbyId) })
    }

    public getLobbiesWithPlayer = async (userId: string): Promise<Array<LobbyClass>> => {
        return LobbyModel.find({ 'players.userId': userId })
    }

    public getUser = async (userId: string): Promise<UserClass | null> => {
        return UserModel.findOne({ _id: new Types.ObjectId(userId) })
    }

    public getUserByHandle = async (handle: string): Promise<UserClass | null> => {
        return UserModel.findOne({ handle })
    }

    public getCharacter = async (characterId: string): Promise<CharacterClass | null> => {
        return CharacterModel.findOne({ _id: new Types.ObjectId(characterId) })
    }

    public getCharacterByDescriptor = async (descriptor: string): Promise<CharacterClass | null> => {
        return CharacterModel.findOne({ descriptor })
    }

    public getCombatPreset = async (combatPresetId: string): Promise<CombatClass | null> => {
        return CombatModel.findOne({ _id: new Types.ObjectId(combatPresetId) })
    }

    public createNewUser = async (handle: string, hashedPassword: string): Promise<Types.ObjectId> => {
        const user = new UserModel({ handle, hashedPassword, createdAt: new Date() })
        await this.saveDocument(user)
        return user._id
    }

    public createNewLobby = async (lobbyName: string, gm_id: string): Promise<Types.ObjectId> => {
        const gm = await this.getUser(gm_id)
        if (!gm) throw new NotFound('User not found')
        const lobby = new LobbyModel({
            name: lobbyName,
            createdAt: new Date(),
            gm_id: gm_id,
            players: [{ userId: gm_id, nickname: gm.handle }],
            relatedPresets: [],
        })
        await this.saveDocument(lobby)
        return lobby._id
    }

    public addPlayerToLobby = async (lobbyId: string, userId: string, nickname: string): Promise<void> => {
        const user = await this.getUser(userId)
        if (!user) throw new NotFound('User not found')
        const lobby = await this.getLobby(lobbyId)
        if (!lobby) throw new NotFound('Lobby not found')

        lobby.players.push({ nickname, userId })
        await mongoose.connection
            .collection('lobbies')
            .updateOne({ _id: new Types.ObjectId(lobbyId) }, { $set: { players: lobby.players } })
    }

    public createNewCharacter = async (
        descriptor: string,
        decorations: { name: string; description: string; sprite: string },
        attributes: Array<AttributeClass>
    ): Promise<Types.ObjectId> => {
        if (!DESCRIPTOR_NO_DLC_REGEX().test(descriptor)) throw new BadRequest('Invalid descriptor')
        const isDescriptorTaken = await CharacterModel.findOne({ descriptor }, { _id: 1 }).lean()
        if (isDescriptorTaken) throw new BadRequest('Descriptor already taken')
        const entity = new CharacterModel({ descriptor, decorations, attributes })
        await this.saveDocument(entity)
        return entity._id
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
        const combatPreset = new CombatModel({ field })
        await this.saveDocument(combatPreset)
        return combatPreset._id
    }

    public updateCharacterBank = async (
        lobbyId: string,
        newCharacterBank: Array<{ characterId: string; controlledBy: Array<string> }>
    ): Promise<void> => {
        await mongoose.connection
            .collection('lobbies')
            .updateOne({ _id: new Types.ObjectId(lobbyId) }, { $set: { characterBank: newCharacterBank } })
    }

    public assignCharacterToPlayer = async (lobbyId: string, userId: string, characterId: string): Promise<void> => {
        const lobby = await this.getLobby(lobbyId)
        if (!lobby) throw new NotFound('Lobby not found')
        const player = lobby.players.find((p) => p.userId === userId)
        if (!player) throw new NotFound('Player not found')
        const characterInLobbyBank = lobby.characterBank.find((c) => c.characterId === characterId)
        if (!characterInLobbyBank) throw new NotFound('Character not found')
        const character = await this.getCharacter(characterId)
        if (!character) {
            lobby.characterBank = lobby.characterBank.filter((c) => c.characterId !== characterId)
            await mongoose.connection
                .collection('lobbies')
                .updateOne({ _id: new Types.ObjectId(lobbyId) }, { $set: { characterBank: lobby.characterBank } })
            throw new NotFound('Entity you were looking for was removed from Database, but not from lobby. Removing.')
        }
        if (!characterInLobbyBank.controlledBy) characterInLobbyBank.controlledBy = []
        if (!characterInLobbyBank.controlledBy.includes(userId)) {
            characterInLobbyBank.controlledBy.push(userId)
        }
        await this.updateCharacterBank(lobbyId, lobby.characterBank)
    }

    public removeCharacterFromPlayer = async (lobbyId: string, userId: string, characterId: string): Promise<void> => {
        const lobby = await this.getLobby(lobbyId)
        if (!lobby) throw new NotFound('Lobby not found')
        const player = lobby.players.find((p) => p.userId === userId)
        if (!player) throw new NotFound('Player not found')
        const characterInLobbyBank = lobby.characterBank.find((c) => c.characterId === characterId)
        if (!characterInLobbyBank) throw new NotFound('Character not found')
        if (!characterInLobbyBank.controlledBy) characterInLobbyBank.controlledBy = []
        if (characterInLobbyBank.controlledBy.includes(userId)) {
            characterInLobbyBank.controlledBy = characterInLobbyBank.controlledBy.filter((c) => c !== userId)
        }
        await this.updateCharacterBank(lobbyId, lobby.characterBank)
    }

    public addCharacterToLobby = async (
        lobbyId: string,
        characterId: string,
        controlledBy: Array<string>
    ): Promise<void> => {
        const lobby = await this.getLobby(lobbyId)
        if (!lobby) throw new NotFound('Lobby not found')
        const character = await this.getCharacter(characterId)
        if (!character) throw new NotFound('Character not found')
        lobby.characterBank.push({ characterId, controlledBy: controlledBy || [] })
        await mongoose.connection
            .collection('lobbies')
            .updateOne({ _id: new Types.ObjectId(lobbyId) }, { $set: { characterBank: lobby.characterBank } })
    }

    public addWeaponToCharacter = async (
        lobby_id: string,
        character_id: string,
        descriptor: string,
        quantity: number
    ): Promise<void> => {
        const lobby = await this.getLobby(lobby_id)
        if (!lobby) throw new NotFound('Lobby not found')
        const character = await this.getCharacter(character_id)
        if (!character) throw new NotFound('Character not found')
        if (!character.weaponry) character.weaponry = []
        character.weaponry.push({ descriptor, quantity })
        await mongoose.connection
            .collection('characters')
            .updateOne({ _id: new Types.ObjectId(character_id) }, { $set: { weaponry: character.weaponry } })
    }

    public addSpellToCharacter = async (
        lobby_id: string,
        character_id: string,
        descriptor: string,
        conflictsWith: Array<string>,
        requiresToUse: Array<string>
    ): Promise<void> => {
        const lobby = await this.getLobby(lobby_id)
        if (!lobby) throw new NotFound('Lobby not found')
        const character = await this.getCharacter(character_id)
        if (!character) throw new NotFound('Character not found')
        if (!character.spellBook) character.spellBook = []
        if (character.spellBook.find((s) => s.descriptor === descriptor)) throw new BadRequest('Spell already exists')
        character.spellBook.push({ descriptor, conflictsWith, requiresToUse })
        await mongoose.connection
            .collection('characters')
            .updateOne({ _id: new Types.ObjectId(character_id) }, { $set: { spellBook: character.spellBook } })
    }

    public addStatusEffectToCharacter = async (
        lobby_id: string,
        character_id: string,
        descriptor: string,
        duration: number
    ): Promise<void> => {
        const lobby = await this.getLobby(lobby_id)
        if (!lobby) throw new NotFound('Lobby not found')
        const character = await this.getCharacter(character_id)
        if (!character) throw new NotFound('Character not found')
        if (!character.statusEffects) character.statusEffects = []
        character.statusEffects.push({ descriptor, duration })
        await mongoose.connection
            .collection('characters')
            .updateOne({ _id: new Types.ObjectId(character_id) }, { $set: { statusEffects: character.statusEffects } })
    }

    public addItemToCharacter = async (
        lobby_id: string,
        character_id: string,
        descriptor: string,
        quantity: number
    ): Promise<void> => {
        const lobby = await this.getLobby(lobby_id)
        if (!lobby) throw new NotFound('Lobby not found')
        const character = await this.getCharacter(character_id)
        if (!character) throw new NotFound('Character not found')
        if (!character.inventory) character.inventory = []
        character.inventory.push({ descriptor, quantity })
        await mongoose.connection
            .collection('characters')
            .updateOne({ _id: new Types.ObjectId(character_id) }, { $set: { inventory: character.inventory } })
    }

    public addAttributeToCharacter = async (
        lobby_id: string,
        character_id: string,
        dlc: string,
        descriptor: string,
        value: number
    ): Promise<void> => {
        const lobby = await this.getLobby(lobby_id)
        if (!lobby) throw new NotFound('Lobby not found')
        const character = await this.getCharacter(character_id)
        if (!character) throw new NotFound('Character not found')
        if (!character.attributes) character.attributes = []
        const attribute = character.attributes.find((a) => a.dlc === dlc && a.descriptor === descriptor)
        if (attribute) {
            attribute.value = value
        } else {
            character.attributes.push({ dlc, descriptor, value })
        }
        await mongoose.connection
            .collection('characters')
            .updateOne({ _id: new Types.ObjectId(character_id) }, { $set: { attributes: character.attributes } })
    }

    public changeSpellLayoutOfCharacter = async (
        lobby_id: string,
        character_id: string,
        spells: Array<string>
    ): Promise<void> => {
        const lobby = await this.getLobby(lobby_id)
        if (!lobby) throw new NotFound('Lobby not found')
        const character = await this.getCharacter(character_id)
        if (!character) throw new NotFound('Character not found')
        if (!character.spellLayout) character.spellLayout = { max: 4, layout: [] }
        if (spells.length > character.spellLayout.max) throw new BadRequest('Too many spells')
        character.spellLayout.layout = spells
        await mongoose.connection
            .collection('characters')
            .updateOne({ _id: new Types.ObjectId(character_id) }, { $set: { spellLayout: character.spellLayout } })
    }

    public getCharactersOfPlayer = async (lobbyId: string, userId: string): Promise<Array<CharacterClass>> => {
        const lobby = await this.getLobby(lobbyId)
        if (!lobby) throw new NotFound('Lobby not found')
        const player = lobby.players.find((p) => p.userId === userId)
        if (!player) throw new NotFound('Player not found')
        const characters: Array<CharacterClass> = []
        await this.checkIfThereAreCharacterMissing(lobby, lobbyId)
        for (const { controlledBy, characterId } of lobby.characterBank) {
            if (controlledBy.includes(userId)) {
                const character = await this.getCharacter(characterId)
                if (!character) {
                    console.log(
                        "Found character that doesn't exist in Database. DatabaseService.checkIfThereAreCharacterMissing() has failed!"
                    )
                } else characters.push(character)
            }
        }
        return characters
    }

    private checkIfThereAreCharacterMissing = async (lobby: LobbyClass, lobby_id: string): Promise<void> => {
        let missingCharacters = false
        const misses: Array<string> = []
        for (const { characterId } of lobby.characterBank) {
            const character = await this.getCharacter(characterId)
            if (!character) {
                missingCharacters = true
                misses.push(characterId)
            }
        }
        if (missingCharacters) {
            lobby.characterBank = lobby.characterBank.filter((c) => !misses.includes(c.characterId))
            await this.updateCharacterBank(lobby_id, lobby.characterBank)
        }
    }

    public getCharactersOfLobby = async (lobbyId: string): Promise<Array<CharacterClass>> => {
        const lobby = await this.getLobby(lobbyId)
        if (!lobby) throw new NotFound('Lobby not found')
        const characters: Array<CharacterClass> = []
        await this.checkIfThereAreCharacterMissing(lobby, lobbyId)
        for (const { characterId } of lobby.characterBank) {
            const character = await this.getCharacter(characterId)
            if (!character) {
                console.log(
                    "Found character that doesn't exist in Database. DatabaseService.checkIfThereAreCharacterMissing() has failed!"
                )
                continue
            }
            characters.push(character)
        }
        return characters
    }
}

export default new DatabaseService()
