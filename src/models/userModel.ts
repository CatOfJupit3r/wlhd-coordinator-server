import { getModelForClass, prop } from '@typegoose/typegoose'
import mongoose from 'mongoose'

export class UserClass {
    @prop({ required: true })
    _id: mongoose.Types.ObjectId

    @prop({ required: true })
    password: string

    @prop({ required: true })
    handle: string
}

export const UserModel = getModelForClass(UserClass, {
    schemaOptions: { collection: 'users' },
})
