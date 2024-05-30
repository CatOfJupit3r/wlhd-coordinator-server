import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose'
import { AttributeClass, CustomAttributeClass } from './AttributeClass'

const requiredProp = (options: { [key: string]: any } = {}) => prop({ required: true, ...options })

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

class ItemClass {
    @requiredProp()
    descriptor: string

    @prop({ default: 1 })
    count: number
}

class SpellClass {
    @requiredProp()
    descriptor: string

    @prop({ type: () => [String], default: [] })
    conflictsWith: Array<string>

    @prop({ type: () => [String], default: [] })
    requiresToUse: Array<string>
}

class StatusEffectClass {
    @requiredProp()
    descriptor: string

    @requiredProp()
    duration: number
}

class SpellLayoutClass {
    @requiredProp()
    max: number

    @prop({ type: () => [String], default: [] })
    layout: Array<string>
}

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

    @prop({ default: [], type: () => [String] })
    controlledBy: Array<string>

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

    @prop({ type: () => AttributeClass, _id: false })
    attributes: AttributeClass

    @prop({ type: () => [CustomAttributeClass], default: [], _id: false })
    customAttributes: Array<CustomAttributeClass>

    @prop({ type: () => [ItemClass], default: [], _id: false })
    inventory: Array<ItemClass>

    @prop({ type: () => [ItemClass], default: [], _id: false })
    weaponry: Array<ItemClass>

    @prop({ type: () => [SpellClass], default: [], _id: false })
    spellBook: Array<SpellClass>

    @prop({ default: { max: 4, layout: [] }, _id: false, type: () => SpellLayoutClass })
    spellLayout: SpellLayoutClass

    @prop({ type: () => [StatusEffectClass], default: [], _id: false })
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
