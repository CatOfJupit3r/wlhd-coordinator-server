import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose'

@modelOptions({ schemaOptions: { collection: 'lobbies' } })
export class LobbyClass {
    @prop({ required: true })
    name: string

    @prop({ required: true })
    createdAt: Date

    @prop({ required: true })
    gm_id: string // id of user in `Users` collection

    @prop({ required: true, type: () => [PlayerClass] })
    players: Array<PlayerClass>

    @prop({ required: true, type: () => [String] })
    relatedPresets: Array<string> // id of preset in `combat_presets` collection
}

class PlayerClass {
    @prop({ required: true })
    userId: string // id of user in `Users` collection

    @prop({ required: true })
    nickname: string

    @prop({ default: null })
    mainCharacter?: string
}

export const LobbyModel = getModelForClass(LobbyClass, {
    schemaOptions: { collection: 'lobbies' },
})
