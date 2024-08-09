import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose'
import { Types } from 'mongoose'

const requiredProp = (options: { [key: string]: unknown } = {}) => prop({ required: true, ...options })

@modelOptions({ schemaOptions: { _id: false } })
export class AttributeClass {
    @prop({ required: true, default: 'builtins' })
    dlc: string

    @prop({ required: true })
    descriptor: string

    @prop({ default: 0 })
    value: number
}

@modelOptions({ schemaOptions: { _id: false } })
class AbilitiesPointsClass {
    @requiredProp()
    will: number

    @requiredProp()
    reflexes: number

    @requiredProp()
    strength: number

    @requiredProp()
    max: number
}

@modelOptions({ schemaOptions: { _id: false } })
class LevelClass {
    @prop({ default: 1 })
    current: number

    @prop({ default: 1 })
    max: number
}

@modelOptions({ schemaOptions: { _id: false } })
class ItemClass {
    @requiredProp()
    descriptor: string

    @prop({ default: 1 })
    quantity: number
}

@modelOptions({ schemaOptions: { _id: true } })
class SpellClass {
    @requiredProp()
    descriptor: string

    @prop()
    _id: Types.ObjectId
}

@modelOptions({ schemaOptions: { _id: false } })
class StatusEffectClass {
    @requiredProp()
    descriptor: string

    @requiredProp()
    duration: number
}

@modelOptions({ schemaOptions: { _id: false } })
class SpellLayoutClass {
    @requiredProp()
    max: number

    @prop({ type: () => [String], default: [] })
    layout: Array<string>
}

@modelOptions({ schemaOptions: { _id: false } })
class CharacterDecorationsClass {
    @requiredProp()
    name: string

    @requiredProp()
    description: string

    @requiredProp()
    sprite: string
}

@modelOptions({ schemaOptions: { _id: false } })
class CharacterSpellBook {
    @requiredProp({ type: () => [SpellClass], default: [] })
    knownSpells: Array<SpellClass>

    @requiredProp({ default: 0 })
    maxActiveSpells: number

    @requiredProp({ type: () => [String], default: [] })
    activeSpells: Array<string>
}

@modelOptions({ schemaOptions: { collection: 'characters' } })
export class CharacterClass {
    @prop()
    _id: Types.ObjectId

    @requiredProp()
    descriptor: string

    @prop({ required: true, _id: false, type: () => CharacterDecorationsClass })
    decorations: CharacterDecorationsClass

    @prop({ default: { current: 0, max: 0 }, _id: false, type: () => LevelClass })
    level: LevelClass

    @prop({ default: 0 })
    gold: number

    @prop({ type: () => [String], default: [] })
    alignments: Array<string>

    @prop({
        _id: false,
        default: { will: 0, reflexes: 0, strength: 0, max: 0 },
        type: () => AbilitiesPointsClass,
    })
    abilitiesPoints: AbilitiesPointsClass

    @prop({ type: () => [AttributeClass], default: [] })
    attributes: Array<AttributeClass>

    @prop({ type: () => [ItemClass], default: [] })
    inventory: Array<ItemClass>

    @prop({ type: () => [ItemClass], default: [] })
    weaponry: Array<ItemClass>

    @prop({
        type: () => CharacterSpellBook,
        default: {
            knownSpells: [],
            maxActiveSpells: 0,
        },
    })
    spellBook: CharacterSpellBook

    @prop({ type: () => [StatusEffectClass], default: [] })
    statusEffects: Array<StatusEffectClass>
}

export const CharacterModel = getModelForClass(CharacterClass)
