import { TranslatableString } from './Translation'

export interface GameHandshake {
    gameId: string
    roundCount: number
    messages: Array<Array<TranslatableString>>
    combatStatus: 'ongoing' | 'pending'
    currentBattlefield: Battlefield
    allEntitiesInfo: {
        [key: string]: EntityInfo
    }
    entityActions: EntityAction | null
    currentPlayer: string | null
    currentEntity: string | null
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
    id: string
    square: { line: string; column: string }
    attributes: { [attribute: string]: string }
    controlled_by: ControlInfo

    items: Array<{
        descriptor: string
        cost: number
        uses: number | null
        cooldown: { current: number; max: number }
        count: number // how many of given item entity has
        consumable: boolean // if item is consumable
    }>
    weapons: Array<{
        descriptor: string
        cost: number
        uses: number | null
        consumable: boolean
        count: number
        cooldown: { current: number; max: number }
        isActive: boolean
    }>
    spells: Array<{
        descriptor: string
        cost: number
        uses: number | null
        cooldown: { current: number; max: number }
    }>
    status_effects: Array<{
        descriptor: string
        duration: number
    }>
}

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
    field_pawns: {
        [square: string]: {
            entity_preset: { source: 'dlc' | 'embedded'; name: string }
            owner: { type: 'player'; id: string | null } | { type: 'ai'; id: string } | { type: 'game_logic' }
        }
    }
    // we can send presets of entities that are not installed by dlc.
    // For this, define field_pawn with source: 'embedded' and 'name' of a key in this object
    custom_entities: {
        [key: string]: any
    }
}

export type GameMessage = Array<TranslatableString>
export type GameStateContainer = Array<GameMessage>
