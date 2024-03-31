import mongoose, { Types } from 'mongoose'
import { CombatModel } from '../models/combatModel'
import { EntityClass, EntityModel } from '../models/entityModel'
import { LobbyClass, LobbyModel } from '../models/lobbyModel'
import { UserClass, UserModel } from '../models/userModel'

export const getLobby = async (lobbyId: string): Promise<LobbyClass | null> => {
    return LobbyModel.findOne({ _id: new Types.ObjectId(lobbyId) })
}

export const getUser = async (userId: string): Promise<UserClass | null> => {
    return UserModel.findOne({ _id: new Types.ObjectId(userId) })
}

export const getUserByHandle = async (handle: string): Promise<UserClass | null> => {
    return UserModel.findOne({ handle })
}

export const getEntity = async (entityId: string): Promise<EntityClass | null> => {
    return EntityModel.findOne({ _id: new Types.ObjectId(entityId) })
}

export const createNewUser = async (handle: string, hashedPassword: string): Promise<Types.ObjectId> => {
    const user = new UserModel({ handle, hashedPassword, createdAt: new Date() })
    console.log('Creating user', user)
    await user.save({
        validateBeforeSave: true,
    })
    return user._id
}

export const createNewLobby = async (lobbyName: string, handle: string): Promise<Types.ObjectId> => {
    const gm = await getUser(handle)
    if (!gm) {
        throw new Error('User not found')
    }
    const lobby = new LobbyModel({
        name: lobbyName,
        createdAt: new Date(),
        // gm_id: gm._id,
        players: [
            {
                // userId: gm._id,
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
    // lobby.players.push({ nickname, mainCharacter, userId: user._id.toString() })
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

export const createNewCombatPreset = async (
    field: Array<{ path: string; square: string; source: 'embedded' | 'dlc' }>
): Promise<Types.ObjectId> => {
    // eslint-disable-next-line no-extra-semi
    ;(() => {
        const occupiedSquares: Array<string> = []
        for (const pawn of field) {
            if (occupiedSquares.includes(pawn.square)) {
                throw new Error('Square is already occupied')
            }
            occupiedSquares.push(pawn.square)
        }
    })()
    const combatPreset = new CombatModel({ field })
    await combatPreset.save({
        validateBeforeSave: true,
    })
    return combatPreset._id
}

export const getJoinedLobbiesInfo = async (
    userId: string
): Promise<Array<{ name: string; isGm: boolean; _id: string }>> => {
    const res: Array<{ name: string; isGm: boolean; _id: string }> = []
    const lobbies = await LobbyModel.find({ 'players.userId': userId })
    console.log('Lobbies:', lobbies)
    for (const lobby of lobbies) {
        res.push({
            _id: lobby._id.toString(),
            name: lobby.name,
            isGm: lobby.gm_id.toString() === userId,
        })
    }
    return res
}
