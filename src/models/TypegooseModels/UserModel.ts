import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose'

@modelOptions({ schemaOptions: { _id: false } })
class GeneratedAvatar {
    @prop({ required: true })
    pattern: string // pattern to generate the avatar

    @prop({ required: true })
    mainColor: string // main color of the avatar

    @prop({ required: true })
    secondaryColor: string // secondary color of the avatar
}

@modelOptions({ schemaOptions: { _id: false } })
class AvatarHandler {
    @prop({ required: true, enum: ['static', 'generated'] })
    preferred: 'static' | 'generated' // preferred type of avatar

    @prop({ required: true, default: '' })
    url: string // url to the avatar

    @prop({ required: true })
    generated: GeneratedAvatar // generated avatar
}

export class UserClass {
    @prop({ required: true })
    hashedPassword: string

    @prop({ required: true, unique: true })
    handle: string

    @prop({ required: true })
    avatar: AvatarHandler

    @prop({ required: true })
    createdAt: Date
}

export const UserModel = getModelForClass(UserClass, {
    schemaOptions: { collection: 'users' },
})
