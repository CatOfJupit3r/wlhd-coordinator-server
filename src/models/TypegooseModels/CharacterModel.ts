import { DESCRIPTOR_REGEX } from '@configs'
import { getModelForClass, modelOptions, prop, ReturnModelType, Severity } from '@typegoose/typegoose'
import { Types } from 'mongoose'

const requiredProp = (options: { [key: string]: unknown } = {}) => prop({ required: true, ...options })
const validateDescriptor = (value: string) => DESCRIPTOR_REGEX().test(value)

@modelOptions({ schemaOptions: { _id: false } })
export class AttributeClass {
    @prop({
        required: true,
        validate: validateDescriptor,
    })
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
    @requiredProp({ validate: validateDescriptor })
    descriptor: string

    @prop({ default: 1 })
    quantity: number
}

@modelOptions({ schemaOptions: { _id: false } })
class SpellClass {
    @requiredProp({ validate: validateDescriptor })
    descriptor: string

    @prop({ default: false })
    isActive: boolean
}

@modelOptions({ schemaOptions: { _id: false } })
class StatusEffectClass {
    @requiredProp({ validate: validateDescriptor })
    descriptor: string

    @requiredProp({ type: () => Number })
    duration: number | null
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

@modelOptions({ schemaOptions: { _id: false }, options: { allowMixed: Severity.ALLOW } })
class CharacterSpellBook {
    @requiredProp({ type: () => [SpellClass], default: [] })
    knownSpells: Array<SpellClass>

    @requiredProp({ default: null })
    maxActiveSpells: number | null
}

@modelOptions({ schemaOptions: { collection: 'characters' } })
export class CharacterClass {
    @prop()
    _id: Types.ObjectId

    @requiredProp({ unique: true }) //
    descriptor: string

    @prop({ required: true, _id: false, type: () => CharacterDecorationsClass })
    decorations: CharacterDecorationsClass

    @prop({ default: { current: 0, max: 0 }, _id: false, type: () => LevelClass })
    level: LevelClass

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

    public static async findByDescriptor(this: ReturnModelType<typeof CharacterClass>, descriptor: string) {
        return await this.findOne({ descriptor }).exec()
    }
}

export const CharacterModel = getModelForClass(CharacterClass)
