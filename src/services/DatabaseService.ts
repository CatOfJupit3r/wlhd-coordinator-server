import mongoose, { Types } from 'mongoose'
import { EntityClass, EntityModel } from '../models/entityModel'
import { LobbyClass, LobbyModel } from '../models/lobbyModel'
import { UserClass, UserModel } from '../models/userModel'

export const getLobby = async (lobbyId: string): Promise<LobbyClass | null> => {
    return LobbyModel.findOne({ _id: new Types.ObjectId(lobbyId) })
}

export const getUser = async (userId: string): Promise<UserClass | null> => {
    return UserModel.findOne({ _id: new Types.ObjectId(userId) })
}

export const getEntity = async (entityId: string): Promise<EntityClass | null> => {
    return EntityModel.findOne({ _id: new Types.ObjectId(entityId) })
}

export const createNewLobby = async (lobbyName: string, handle: string): Promise<Types.ObjectId> => {
    const gm = await getUser(handle)
    if (!gm) {
        throw new Error('User not found')
    }
    const lobby = new LobbyModel({
        name: lobbyName,
        gm_id: gm._id,
        players: [
            {
                userId: gm._id,
                nickname: gm.handle,
                mainCharacter: null,
            },
        ],
        relatedPresets: [],
    })
    await lobby.save({
        validateBeforeSave: true,
    })
    return lobby._id
}

export const addPlayerToLobby = async (
    lobbyId: string,
    userId: string,
    nickname: string,
    mainCharacter: string
): Promise<void> => {
    const user = await getUser(userId)
    if (!user) {
        throw new Error('User not found')
    }
    const character = await getEntity(mainCharacter)
    if (!character) {
        throw new Error('Character not found')
    }
    const lobby = await getLobby(lobbyId)
    if (!lobby) {
        throw new Error()
    }
    lobby.players.push({ nickname, mainCharacter, userId: user._id.toString() })
    await mongoose.connection
        .collection('lobbies')
        .updateOne({ _id: new Types.ObjectId(lobbyId) }, { $set: { players: lobby.players } })
}

export const createNewEntity = async (
    descriptor: string,
    attributes: { [key: string]: string },
    customAttributes: Array<{ dlc: string; descriptor: string; value: number }>
): Promise<Types.ObjectId> => {
    console.log('Creating entity', descriptor, attributes, customAttributes)
    const entity = new EntityModel({ descriptor, attributes, customAttributes: customAttributes })
    await entity.save({
        validateBeforeSave: true,
    })
    return entity._id
}
