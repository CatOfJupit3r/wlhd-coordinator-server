import { TranslatableString } from './Translation'

export interface GameComponentDecoration {
    name: string
    sprite: string
    description: string
}

export interface GameHandshake {
    gameId: string
    roundCount: number
    messages: Array<Array<TranslatableString>>
    turnOrder: {
        currentEntity: string
        turnQueue: Array<string>
        entityActions: EntityAction | null
        currentPlayer: string | null
    }
    combatStatus: 'ongoing' | 'pending'
    currentBattlefield: Battlefield
    allEntitiesInfo: {
        [key: string]: EntityInfo
    }
}

export interface Battlefield {
    field: string[][]
    columns: string[]
    lines: string[]
    connectors: string
    separators: string
    pawns: {
        [key: string]: string
    }
}

interface ControlledByPlayer {
    type: 'player'
    id: string | null
}

interface ControlledByAI {
    type: 'ai'
    id: string
}

interface ControlledByGameLogic {
    type: 'game_logic'
}

export type ControlInfo = ControlledByPlayer | ControlledByAI | ControlledByGameLogic

export interface EntityInfo {
    descriptor: string
    decorations: GameComponentDecoration
    id: string
    square: { line: number; column: number }
    attributes: AttributeInfo
    controlled_by: ControlInfo

    inventory: Array<ItemInfo>
    weaponry: Array<WeaponInfo>
    spell_book: {
        spells: Array<SpellInfo>
        max_active_spells: number | null
    }
    status_effects: Array<StatusEffectInfo>
}

export interface AttributeInfo {
    [attribute: string]: number
}

export interface WeaponInfo {
    descriptor: string
    decorations: GameComponentDecoration
    cost: number
    uses: {
        current: number
        max: number | null
    }
    consumable: boolean
    quantity: number
    user_needs_range: Array<number>
    cooldown: { current: number; max: number }
    isActive: boolean
}

export interface ItemInfo {
    descriptor: string
    decorations: GameComponentDecoration
    cost: number
    uses: {
        current: number
        max: number | null
    }
    user_needs_range: Array<number>
    cooldown: { current: number; max: number }
    quantity: number // how many of given item entity has
    consumable: boolean // if item is consumable
}

export interface SpellInfo {
    descriptor: string
    decorations: GameComponentDecoration
    cost: number
    user_needs_range: Array<number>
    uses: {
        current: number
        max: number | null
    }
    isActive: boolean
    cooldown: { current: number; max: number | null }
}

export interface StatusEffectInfo {
    descriptor: string
    decorations: GameComponentDecoration
    duration: string | null
}

export type FeaturesInfo = SpellInfo | ItemInfo | WeaponInfo | StatusEffectInfo

export interface TranslationInfoAction {
    descriptor: string
    co_descriptor: string | null
}

export interface Action {
    id: string
    translation_info: TranslationInfoAction
    available: boolean
    requires: null | {
        [argument: string]: string
    }
}

export interface EntityAction {
    action: Array<Action>
    aliases: {
        [key: string]: Array<Action>
    }
    alias_translations: {
        [key: string]: string
    }
}

export interface GamePreset {
    round_counter: number
    turn_info: {
        current_entity: string
        turn_queue: Array<string>
    }
    field_pawns: {
        [square: string]: {
            entity_preset: { source: 'dlc' | 'embedded'; name: string }
            owner: ControlInfo
        }
    }
    // we can send presets of entities that are not installed by dlc.
    // For this, define field_pawn with source: 'embedded' and 'name' of a key in this object
    custom_entities: {
        [key: string]: CharacterPreset
    }
}

export type GameMessage = Array<TranslatableString>
export type GameStateContainer = Array<GameMessage>

// object that is understandable by the game servers
export interface CharacterPreset {
    descriptor: string
    decorations: GameComponentDecoration
    attributes: {
        [attribute: string]: number
    }

    inventory: Array<ItemPartialPreset>
    weaponry: Array<WeaponPartialPreset>
    spell_book: { spells: Array<SpellPartialPreset>; max_active_spells: number | null }
    status_effects: Array<StatusEffectPartialPreset>
}

interface ItemPartialPreset {
    descriptor: string
    quantity?: number
    turns_until_usage?: number
    current_consecutive_uses?: number
}

interface WeaponPartialPreset {
    descriptor: string
    quantity?: number
    is_active?: boolean
    turns_until_usage?: number
    current_consecutive_uses?: number
}

interface SpellPartialPreset {
    descriptor: string
    turns_until_usage?: number
    current_consecutive_uses?: number
    is_active?: boolean
}

interface StatusEffectPartialPreset {
    descriptor: string
    duration?: number | null
}
