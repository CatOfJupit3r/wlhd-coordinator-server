import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose'
import { AttributeHolderClass, CustomAttributeClass } from './AttributeHolderClass'

const requiredProp = (options: { [key: string]: any } = {}) => prop({ required: true, ...options })

class SpellClass {
    @requiredProp({ type: String })
    descriptor: string

    @prop({ type: () => [String], default: [] })
    conflictsWith: Array<string>

    @prop({ type: () => [String], default: [] })
    requiresToUse: Array<string>
}

class ItemClass {
    @requiredProp()
    descriptor: string

    @prop({ default: 1 })
    count: number
}

class EntityDecorations {
    @prop({ type: () => [String], default: [] })
    name: string

    @prop({ type: () => [String], default: [] })
    description: string

    @prop({ type: () => [String], default: [] })
    sprite: string
}

@modelOptions({
    schemaOptions: { collection: 'character' },
})
export class EntityClass {
    @prop({ required: true })
    descriptor: string

    @prop({ required: true, _id: false })
    decorations: EntityDecorations

    @prop({ required: true, type: () => AttributeHolderClass, _id: false })
    attributes: AttributeHolderClass

    @prop({ type: () => [CustomAttributeClass], _id: false })
    customAttributes: Array<CustomAttributeClass>

    @prop({ type: () => [SpellClass], default: [], _id: false })
    spellBook: Array<SpellClass>

    @prop({ type: () => [String], default: [] })
    spellLayout: Array<string>

    @prop({ type: () => [ItemClass], default: [], _id: false })
    inventory: Array<ItemClass>

    @prop({ type: () => [ItemClass], default: [], _id: false })
    weaponry: Array<ItemClass>
}

export const EntityModel = getModelForClass(EntityClass)
