import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose'

class AttributeClass {
    @prop({ default: 0 })
    current_health?: number

    @prop({ default: 0 })
    max_health?: number

    @prop({ default: 0 })
    current_action_points?: number

    @prop({ default: 0 })
    current_armor?: number

    @prop({ default: 0 })
    base_armor?: number

    @prop({ default: 0 })
    weapon_bonus_damage?: number

    @prop({ default: 0 })
    weapon_healing_damage?: number

    @prop({ default: 0 })
    athletics?: number

    @prop({ default: 0 })
    caution?: number

    @prop({ default: 0 })
    dexterity?: number

    @prop({ default: 0 })
    persuasion?: number

    @prop({ default: 0 })
    medicine?: number

    @prop({ default: 0 })
    reflexes?: number

    @prop({ default: 0 })
    strength?: number

    @prop({ default: 0 })
    will?: number

    @prop({ default: 0 })
    physical_attack?: number

    @prop({ default: 0 })
    physical_defense?: number

    @prop({ default: 0 })
    fire_attack?: number

    @prop({ default: 0 })
    fire_defense?: number

    @prop({ default: 0 })
    air_attack?: number

    @prop({ default: 0 })
    air_defense?: number

    @prop({ default: 0 })
    water_attack?: number

    @prop({ default: 0 })
    water_defense?: number

    @prop({ default: 0 })
    earth_attack?: number

    @prop({ default: 0 })
    earth_defense?: number

    @prop({ default: 0 })
    nature_attack?: number

    @prop({ default: 0 })
    nature_defense?: number
}

class CustomAttributeClass {
    @prop({ required: true, default: 'builtins' })
    dlc: string

    @prop({ required: true })
    descriptor: string

    @prop({ required: true })
    value: number
}

@modelOptions({
    schemaOptions: { collection: 'entities' },
})
export class EntityClass {
    @prop({ required: true })
    descriptor: string

    @prop({ required: true, type: () => AttributeClass })
    attributes: AttributeClass

    @prop({ type: () => [CustomAttributeClass] })
    customAttributes: Array<CustomAttributeClass>
}

export const EntityModel = getModelForClass(EntityClass, {
    schemaOptions: { collection: 'entities' },
})
