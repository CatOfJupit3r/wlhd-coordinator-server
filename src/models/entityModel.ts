import { getModelForClass, prop } from '@typegoose/typegoose'

export class EntityClass {
    @prop({ required: true })
    descriptor: string

    @prop({ required: true })
    attributes: {
        [key: string]: string
    }
}

export const EntityModel = getModelForClass(EntityClass, {
    schemaOptions: { collection: 'entities' },
})
