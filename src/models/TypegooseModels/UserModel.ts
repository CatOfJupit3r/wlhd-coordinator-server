import { getModelForClass, prop } from '@typegoose/typegoose'

export class UserClass {
    @prop({ required: true })
    hashedPassword: string

    @prop({ required: true })
    handle: string

    @prop({ required: true })
    createdAt: Date
}

export const UserModel = getModelForClass(UserClass, {
    schemaOptions: { collection: 'users' },
})
