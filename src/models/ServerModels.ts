import { GameComponentDecoration, GameComponentMemory } from './GameDLCData'
import { ControlInfo, TurnOrder } from './GameSaveModels'
import { TranslatableString } from './Translation'

export interface GameHandshake {
    gameId: string
    roundCount: number
    messages: Array<Array<TranslatableString>>
    turnInfo: {
        order: TurnOrder

        actions: EntityAction | null
        playerId: string | null
    }
    combatStatus: 'ongoing' | 'pending'
    battlefield: Battlefield
    allEntitiesInfo: {
        [characterID: string]: EntityInfo
    }
}

export interface Battlefield {
    pawns: {
        [key: string]: {
            character_id: string | null
            area_effects: Array<unknown>
        }
    }
}

interface CommonGameComponentInfoFields {
    decorations: GameComponentDecoration
    memory: GameComponentMemory
    tags: Array<string>
}

export interface EntityInfo extends CommonGameComponentInfoFields {
    descriptor: string
    attributes: AttributeInfo
    controlledBy: ControlInfo

    inventory: Array<ItemInfo>
    weaponry: Array<WeaponInfo>
    spellBook: {
        knownSpells: Array<SpellInfo>
        maxActiveSpells: number | null
    }
    statusEffects: Array<StatusEffectInfo>

    square: { line: number; column: number }
    id_: string // is it really there though?
}

export interface AttributeInfo {
    [attribute: string]: number
}

export interface WeaponInfo extends CommonGameComponentInfoFields {
    descriptor: string
    cost: number | null
    uses: {
        current: number
        max: number | null
    }
    consumable: boolean
    quantity: number
    userNeedsRange: Array<number>
    cooldown: { current: number; max: number | null }
    isActive: boolean
    costToSwitch: number
}

export interface ItemInfo extends CommonGameComponentInfoFields {
    descriptor: string
    cost: number | null
    uses: {
        current: number
        max: number | null
    }
    userNeedsRange: Array<number>
    cooldown: { current: number; max: number | null }
    quantity: number // how many of given item entity has
    consumable: boolean // if item is consumable
}

export interface SpellInfo extends CommonGameComponentInfoFields {
    descriptor: string
    cost: number | null
    userNeedsRange: Array<number>
    uses: {
        current: number
        max: number | null
    }
    cooldown: { current: number; max: number | null }
    isActive: boolean
}

export interface StatusEffectInfo extends CommonGameComponentInfoFields {
    descriptor: string
    duration: number | null
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

export type GameMessage = Array<TranslatableString>
export type GameStateContainer = Array<GameMessage>
