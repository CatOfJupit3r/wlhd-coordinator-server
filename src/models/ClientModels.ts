import {
    Battlefield,
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
    currentEntityInfo: EntityInfoTurn | null
    entityTooltips: { [square: string]: EntityInfoTooltip | null }
    controlledEntities: Array<EntityInfoFull> | null
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
    spell_book: Array<SpellInfo>
    status_effects: Array<StatusEffectInfo>
    spellLayout?: Array<string>
}
