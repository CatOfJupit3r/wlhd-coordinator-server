import {
    Battlefield,
    ControlInfo,
    GameComponentDecoration,
    GameStateContainer,
    ItemInfo,
    SpellInfo,
    StatusEffectInfo,
    WeaponInfo,
} from './ServerModels'

export interface GameHandshake {
    roundCount: number
    messages: GameStateContainer // but only last 10 instead of all
    combatStatus: 'ongoing' | 'pending'
    currentBattlefield: Battlefield
    entityTooltips: { [square: string]: EntityInfoTooltip | null }
    controlledEntities: Array<EntityInfoFull> | null
    turnOrder: IndividualTurnOrder
}

export interface EntityInfoTooltip {
    decorations: GameComponentDecoration
    square: { line: string; column: string }
    health: { current: string; max: string }
    action_points: { current: string; max: string }
    armor: { current: string; base: string }
    status_effects: Array<StatusEffectInfo>
}

export interface EntityInfoTurn {
    decorations: GameComponentDecoration
    square: { line: string; column: string }
    action_points: { current: string; max: string }
}

export interface EntityInfoFull {
    decorations: GameComponentDecoration
    square: { line: string; column: string }
    attributes: { [attribute: string]: string }

    inventory: Array<ItemInfo>
    weaponry: Array<WeaponInfo>
    spellBook: Array<SpellInfo>
    status_effects: Array<StatusEffectInfo>
    spellLayout?: Array<string>
}

export interface TurnOrder {
    order: Array<CharacterInTurnOrder>
    current: number | null
}

export interface IndividualTurnOrder {
    order: Array<CharacterInTurnOrderPlayer>
    current: number | null
}

export interface CharacterInTurnOrder {
    controlledBy: ControlInfo
    descriptor: string
    decorations: {
        name: string
        description: string
        sprite: string
    }
    square: {
        line: string
        column: string
    }
}

export type CharacterInTurnOrderPlayer = Omit<CharacterInTurnOrder, 'controlledBy'> & {
    controlledByYou: boolean
}
