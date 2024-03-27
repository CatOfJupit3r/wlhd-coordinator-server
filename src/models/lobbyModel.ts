import { getModelForClass, prop } from '@typegoose/typegoose'

export class LobbyClass {
    @prop({ required: true })
    name: string

    @prop({ required: true })
    gmHandle: string // id of user in `Users` collection

    @prop({ required: true })
    players: {
        [user_id: string]: {
            // id of user in `Users` collection
            nickname: string
            mainCharacter: string // id of character in `Characters` collection
        }
    }

    @prop({ required: true })
    relatedPresets: string[] // id of preset in `combat_presets` collection
}

export const LobbyModel = getModelForClass(LobbyClass)
