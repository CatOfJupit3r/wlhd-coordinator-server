import { getModelForClass, modelOptions, prop, Severity } from '@typegoose/typegoose'

@modelOptions({
    options: { allowMixed: Severity.ALLOW },
})
class ControlledByPlayer {
    @prop({ required: true })
    type: 'player'

    @prop({ required: true })
    id: string | null
}

class ControlledByAI {
    @prop({ required: true })
    type: 'ai'

    @prop({ required: true })
    id: string
}

class ControlledByGameLogic {
    @prop({ required: true })
    type: 'game_logic'
}

@modelOptions({
    options: { allowMixed: Severity.ALLOW },
})
class Pawn {
    @prop({ required: true })
    path: string // if source is dlc, then path is descriptor. if source is embedded, then path is id in custom_entities

    @prop({ required: true })
    square: string

    @prop({ required: true, type: () => String })
    source: 'embedded' | 'dlc'

    @prop({ required: true })
    controlled_by: ControlledByPlayer | ControlledByAI | ControlledByGameLogic
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
