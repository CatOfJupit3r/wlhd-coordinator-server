import { DocumentType } from '@typegoose/typegoose'
import mongoose, { Types } from 'mongoose'
import { BadRequest, InternalServerError, NotFound } from '../models/ErrorModels'
import { CombatClass, CombatModel } from '../models/combatModel'
import { EntityClass, EntityModel } from '../models/entityModel'
import { LobbyClass, LobbyModel } from '../models/lobbyModel'
import { UserClass, UserModel } from '../models/userModel'

class DatabaseService {
    public connect = async (): Promise<void> => {
        await mongoose.connect('mongodb://localhost:27017/gameDB')
    }

    private saveDocument = async (
        document:
            | DocumentType<LobbyClass>
            | DocumentType<UserClass>
            | DocumentType<EntityClass>
            | DocumentType<CombatClass>
    ) => {
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

    public addPlayerToLobby = async (
        lobbyId: string,
        userId: string,
        nickname: string,
        mainCharacter: string
    ): Promise<void> => {
        const user = await this.getUser(userId)
        if (!user) throw new NotFound('User not found')
        const character = await this.getEntity(mainCharacter)
        if (!character) throw new NotFound('Character not found')
        const lobby = await this.getLobby(lobbyId)
        if (!lobby) throw new NotFound('Lobby not found')

        lobby.players.push({ nickname, mainCharacter, userId })
        await mongoose.connection
            .collection('lobbies')
            .updateOne({ _id: new Types.ObjectId(lobbyId) }, { $set: { players: lobby.players } })
    }

    public createNewEntity = async (
        descriptor: string,
        attributes: { [key: string]: string },
        customAttributes: Array<{ dlc: string; descriptor: string; value: number }>
    ): Promise<Types.ObjectId> => {
        console.log('Creating entity', descriptor, attributes, customAttributes)
        const entity = new EntityModel({ descriptor, attributes, customAttributes })
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
        const res: Array<{ name: string; isGm: boolean; _id: string }> = []
        const lobbies = await LobbyModel.find({ 'players.userId': userId })
        for (const lobby of lobbies) {
            const { _id, name, gm_id } = lobby
            if (!_id || !name || !gm_id) throw new InternalServerError()
            res.push({
                _id: _id.toString(),
                name,
                isGm: gm_id.toString() === userId,
            })
        }
        return res
    }

    public getCharacterInfo = async (characterId: string): Promise<EntityClass> => {
        const character = await this.getEntity(characterId)
        if (!character) throw new NotFound('Character not found')
        return character
    }

    public assignCharacterToPlayer = async (lobbyId: string, userId: string, characterId: string): Promise<void> => {
        const lobby = await this.getLobby(lobbyId)
        if (!lobby) throw new NotFound('Lobby not found')
        const player = lobby.players.find((p) => p.userId === userId)
        if (!player) throw new NotFound('Player not found')

        player.mainCharacter = characterId
        await mongoose.connection
            .collection('lobbies')
            .updateOne({ _id: new Types.ObjectId(lobbyId) }, { $set: { players: lobby.players } })
    }
}

export default new DatabaseService()
