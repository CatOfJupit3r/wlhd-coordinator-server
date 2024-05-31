import { DocumentType } from '@typegoose/typegoose'
import mongoose, { Types } from 'mongoose'
import { BadRequest, InternalServerError, NotFound } from '../models/ErrorModels'
import { CharacterInfo } from '../models/InfoModels'
import {
    AttributeClass,
    CharacterClass,
    CharacterModel,
    CombatClass,
    CombatModel,
    EntityClass,
    EntityModel,
    LobbyClass,
    LobbyModel,
    UserClass,
    UserModel,
} from '../models/TypegooseModels'
import { characterModelToInfo } from '../utils/characterConverters'

type SupportedDocumentTypes =
    | DocumentType<LobbyClass>
    | DocumentType<UserClass>
    | DocumentType<EntityClass>
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

    public getUser = async (userId: string): Promise<UserClass | null> => {
        return UserModel.findOne({ _id: new Types.ObjectId(userId) })
    }

    public getUserByHandle = async (handle: string): Promise<UserClass | null> => {
        return UserModel.findOne({ handle })
    }

    public getEntity = async (entityId: string): Promise<EntityClass | null> => {
        return EntityModel.findOne({ _id: new Types.ObjectId(entityId) })
    }

    public getCharacter = async (characterId: string): Promise<CharacterClass | null> => {
        return CharacterModel.findOne({ _id: new Types.ObjectId(characterId) })
    }

    public getCombatPreset = async (combatPresetId: string): Promise<CombatClass | null> => {
        return CombatModel.findOne({ _id: new Types.ObjectId(combatPresetId) })
    }

    public createNewUser = async (handle: string, hashedPassword: string): Promise<Types.ObjectId> => {
        const user = new UserModel({ handle, hashedPassword, createdAt: new Date() })
        console.log('Creating user', user)
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
            players: [
                {
                    userId: gm_id,
                    nickname: gm.handle,
                    mainCharacter: null,
                },
            ],
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
        // eslint-disable-next-line no-extra-semi
        ;(() => {
            const occupiedSquares: Array<string> = []
            for (const pawn of field) {
                if (occupiedSquares.includes(pawn.square)) throw new BadRequest('Multiple pawns on the same square')
                occupiedSquares.push(pawn.square)
            }
        })()
        const combatPreset = new CombatModel({ field })
        await this.saveDocument(combatPreset)
        return combatPreset._id
    }

    public getJoinedLobbiesInfo = async (
        userId: string
    ): Promise<Array<{ name: string; isGm: boolean; _id: string }>> => {
        const res: Array<{ name: string; isGm: boolean; _id: string; assignedCharacter: string | null }> = []
        const lobbies = await LobbyModel.find({ 'players.userId': userId })
        for (const lobby of lobbies) {
            const { _id, name, gm_id } = lobby
            if (!_id || !name || !gm_id) throw new InternalServerError()
            const assignedCharacter: string | null = null
            for (const player of lobby.players) {
                // if (player.userId === userId) {
                //     const characterId = player.characterId
                //     if (!characterId) break
                //     const character = await this.getEntity(characterId)
                //     if (!character) break
                //     assignedCharacter =
                //         character.decorations?.name || character.descriptor ? `${character.descriptor}.name` : null
                // }
            }

            res.push({
                _id: _id.toString(),
                name,
                isGm: gm_id.toString() === userId,
                assignedCharacter,
            })
        }
        return res
    }

    public getCharacterInfo = async (characterId: string): Promise<CharacterInfo> => {
        const character = await this.getCharacter(characterId)
        if (!character) throw new NotFound('Character not found')
        return characterModelToInfo(character)
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
        await mongoose.connection
            .collection('lobbies')
            .updateOne({ _id: new Types.ObjectId(lobbyId) }, { $set: { characterBank: lobby.characterBank } })
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

    public getCharactersOfPlayer = async (lobbyId: string, userId: string): Promise<Array<CharacterClass>> => {
        const lobby = await this.getLobby(lobbyId)
        if (!lobby) throw new NotFound('Lobby not found')
        const player = lobby.players.find((p) => p.userId === userId)
        if (!player) throw new NotFound('Player not found')
        const characters: Array<CharacterClass> = []
        for (const characterInLobby of lobby.characterBank) {
            if (characterInLobby.controlledBy.includes(userId)) {
                const character = await this.getCharacter(characterInLobby.characterId)
                if (!character) throw new NotFound('Character not found')
                characters.push(character)
            }
        }
        return characters
    }
}

export default new DatabaseService()
