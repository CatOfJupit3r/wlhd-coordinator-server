import mongoose, { Types } from 'mongoose'
import { EntityClass, EntityModel } from '../models/entityModel'
import { LobbyClass, LobbyModel } from '../models/lobbyModel'
import { UserClass, UserModel } from '../models/userModel'

export const getLobby = async (lobbyId: string): Promise<LobbyClass | null> => {
    return LobbyModel.findOne({ _id: new Types.ObjectId(lobbyId) })
}

export const getUser = async (handle: string): Promise<UserClass | null> => {
    return UserModel.findOne({ handle })
}

export const getEntity = async (entityId: string): Promise<EntityClass | null> => {
    return EntityModel.findOne({ _id: new Types.ObjectId(entityId) })
}

export const createNewLobby = async (lobbyName: string, handle: string): Promise<Types.ObjectId> => {
    const gm = await getUser(handle)
    console.log(gm)
    if (!gm) {
        throw new Error('User not found')
    }
    const lobby = new LobbyModel({
        name: lobbyName,
        gmHandle: handle,
        players: {
            [handle]: {
                nickname: 'GM',
                mainCharacter: '',
            },
        },
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
    const lobby = await getLobby(lobbyId)
    const user = await getUser(userId)
    const character = await getEntity(mainCharacter)
    if (!user) {
        throw new Error('User not found')
    }
    if (!lobby) {
        throw new Error('Lobby not found')
    }
    if (!character) {
        throw new Error('Character not found')
    }
    lobby.players[userId] = { nickname, mainCharacter }
    await mongoose.connection
        .collection('lobbies')
        .updateOne({ _id: new Types.ObjectId(lobbyId) }, { $set: { players: lobby.players } })
}
