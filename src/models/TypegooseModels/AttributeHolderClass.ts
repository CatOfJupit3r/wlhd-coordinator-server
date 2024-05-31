import { modelOptions, prop } from '@typegoose/typegoose'

const attributeProp = (defaultVal: number = 0) => prop({ default: defaultVal })

export class AttributeHolderClass {
    @attributeProp()
    current_health: number

    @attributeProp()
    max_health: number

    @attributeProp()
    current_action_points: number

    @attributeProp()
    current_armor: number

    @attributeProp()
    base_armor: number

    @attributeProp()
    weapon_bonus_damage: number

    @attributeProp()
    weapon_healing_damage: number

    @attributeProp()
    athletics: number

    @attributeProp()
    caution: number

    @attributeProp()
    dexterity: number

    @attributeProp()
    persuasion: number

    @attributeProp()
    medicine: number

    @attributeProp()
    reflexes: number

    @attributeProp()
    strength: number

    @attributeProp()
    will: number

    @attributeProp()
    physical_attack: number

    @attributeProp()
    physical_defense: number

    @attributeProp()
    fire_attack: number

    @attributeProp()
    fire_defense: number

    @attributeProp()
    air_attack: number

    @attributeProp()
    air_defense: number

    @attributeProp()
    water_attack: number

    @attributeProp()
    water_defense: number

    @attributeProp()
    earth_attack: number

    @attributeProp()
    earth_defense: number

    @attributeProp()
    nature_attack: number

    @attributeProp()
    nature_defense: number

    @attributeProp()
    gold: number
}

@modelOptions({ schemaOptions: { _id: false } })
export class CustomAttributeClass {
    @prop({ required: true, default: 'builtins' })
    dlc: string

    @prop({ required: true })
    descriptor: string

    @prop({ default: 0 })
    value: number
}
