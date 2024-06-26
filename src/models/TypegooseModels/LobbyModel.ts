import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose'
import { Types } from 'mongoose'

export class CharacterInLobbyClass {
    @prop({ required: true })
    characterId: string

    @prop({ default: [], type: () => [String] })
    controlledBy: Array<string>
}

export class PlayerClass {
    @prop({ required: true })
    userId: string // id of user in `Users` collection

    @prop({ required: true })
    nickname: string
}

@modelOptions({ schemaOptions: { collection: 'lobbies' } })
export class LobbyClass {
    @prop()
    _id: Types.ObjectId

    @prop({ required: true })
    name: string

    @prop({ required: true })
    createdAt: Date

    @prop({ required: true })
    gm_id: string // id of user in `Users` collection

    @prop({ default: [], type: () => [PlayerClass], _id: false })
    players: Array<PlayerClass>

    @prop({ default: [], type: () => [CharacterInLobbyClass] })
    characterBank: Array<CharacterInLobbyClass>

    @prop({ default: [], type: () => [String] })
    relatedPresets: Array<string> // id of preset in `combat_presets` collection
}

export const LobbyModel = getModelForClass(LobbyClass, {
    schemaOptions: { collection: 'lobbies' },
})
