// import { getModelForClass, prop } from '@typegoose/typegoose'
//
//
// const betterProp = () => prop({ required: true })
//
// class SpellClass {
//
// }
//
// class SpellBookClass {
//     @betterProp()
//     spells: Array<SpellClass>
// }
//
//
// class ItemClass {}
//
//
// class StatusEffectClass {}
//
// class WeaponClass {}
//
// class AbilitiesPointsClass {
//     @betterProp()
//     will: number
//
//     @betterProp()
//     reflexes: number
//
//     @betterProp()
//     strength: number
//
//     @betterProp()
//     unallocated: number
// }
//
// class CharacterClass {
//     @betterProp()
//     descriptor: string
//
//     @betterProp()
//     abilitiesPoints: AbilitiesPointsClass
//
//     @betterProp()
//     inventory: Array<ItemClass>
//
//     @betterProp()
//     weaponry: Array<WeaponClass>
//
//     @betterProp()
//     spellBook: SpellBookClass
//
//     @betterProp() // status effects that are applied on EACH battle start
//     statusEffects: Array<StatusEffectClass>
// }
//
// export const CharacterModel = getModelForClass(CharacterClass)

export {}
