import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose'

class Pawn {
    @prop({ required: true })
    path: string // if source is dlc, then path is descriptor. if source is embedded, then path is id in custom_entities

    @prop({ required: true })
    square: string

    @prop({ required: true, type: () => String })
    source: 'embedded' | 'dlc'
}

@modelOptions({
    schemaOptions: { collection: 'combatPresets' },
})
export class CombatClass {
    @prop({ required: true, type: () => [Pawn] })
    field: Array<Pawn>
}

export const CombatModel = getModelForClass(CombatClass, {
    schemaOptions: { collection: 'combatPresets' },
})
