import { getModelForClass, prop } from '@typegoose/typegoose'

export class UserClass {
    @prop({ required: true })
    password: string

    @prop({ required: true })
    handle: string
}

export const UserModel = getModelForClass(UserClass, {
    schemaOptions: { collection: 'users' },
})
