import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose'

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
    unallocated: number
}

@modelOptions({ schemaOptions: { _id: false } })
class ItemClass {
    @requiredProp()
    descriptor: string

    @prop({ default: 1 })
    quantity: number
}

@modelOptions({ schemaOptions: { _id: false } })
class SpellClass {
    @requiredProp()
    descriptor: string

    @prop({ type: () => [String], default: [] })
    conflictsWith: Array<string>

    @prop({ type: () => [String], default: [] })
    requiresToUse: Array<string>
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

@modelOptions({ schemaOptions: { collection: 'characters' } })
export class CharacterClass {
    @requiredProp()
    descriptor: string

    @prop({ required: true, _id: false, type: () => CharacterDecorationsClass })
    decorations: CharacterDecorationsClass

    @requiredProp()
    level: number

    @prop({ type: () => [String], default: [] })
    alignments: Array<string>

    @prop({
        _id: false,
        default: { will: 0, reflexes: 0, strength: 0, unallocated: 0 },
        type: () => AbilitiesPointsClass,
    })
    abilitiesPoints: AbilitiesPointsClass

    @prop({ type: () => [AttributeClass], default: [] })
    attributes: Array<AttributeClass>

    @prop({ type: () => [ItemClass], default: [] })
    inventory: Array<ItemClass>

    @prop({ type: () => [ItemClass], default: [] })
    weaponry: Array<ItemClass>

    @prop({ type: () => [SpellClass], default: [] })
    spellBook: Array<SpellClass>

    @prop({ default: { max: 4, layout: [] }, _id: false, type: () => SpellLayoutClass })
    spellLayout: SpellLayoutClass

    @prop({ type: () => [StatusEffectClass], default: [] })
    statusEffects: Array<StatusEffectClass>
}

// interface CharacterSchema {
//     descriptor: string
//     decorations: { // DOES NOT CONTAIN DESCRIPTOR PATTERNS.
//         name: string
//         description: string
//         sprite: string
//     }
//     level: number
//     alignments: Array<string> // spec tree alignments
//     abilitiesPoints: {
//         will: number
//         reflexes: number
//         strength: number
//         unallocated: number
//     }
//     inventory: Array<{
//         descriptor: string
//         count: number
//     }>
//     weaponry: Array<{
//         descriptor: string
//         count: number
//     }>
//     spellBook: Array<{
//         descriptor: string
//         conflictsWith: Array<string>
//         requiresToUse: Array<string>
//     }>
//     spellLayout: {
//         max: number
//         layout: Array<string>
//     }
//     statusEffects: Array<{
//         descriptor: string
//         duration: number
//     }>
// }

export const CharacterModel = getModelForClass(CharacterClass)
