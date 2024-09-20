import { GameComponentDecoration, GameComponentMemory } from './GameDLCData'

export interface EntityInfoFullToCharacterClass {
    decorations: {
        name: string
        description: string
        sprite: string
    }
    attributes: Array<{
        descriptor: string
        value: number
    }>
    spellBook: {
        maxActiveSpells: number | null
        knownSpells: Array<{
            descriptor: string
            isActive: boolean
        }>
    }
    inventory: Array<{
        descriptor: string
        quantity: number
    }>
    statusEffects: Array<{
        descriptor: string
        duration: number | null
    }>
    weaponry: Array<{
        descriptor: string
        quantity: number
    }>
}

type ControlledByPrototype = {
    type: string
    id?: string
}

interface ControlledByPlayer extends ControlledByPrototype {
    type: 'player'
    id: string
}

interface ControlledByAI extends ControlledByPrototype {
    type: 'ai'
    id: string
}

interface ControlledByGameLogic extends ControlledByPrototype {
    type: 'game_logic'
}

export type ControlledBy = ControlledByPlayer | ControlledByAI | ControlledByGameLogic | ControlledByPrototype

interface CommonEditableField {
    decorations: GameComponentDecoration
    memory: GameComponentMemory
    tags: Array<string>
}

interface UsableComponentEditableFields extends CommonEditableField {
    usageCost: number | null
    turnsUntilUsage: number
    cooldownValue: number | null
    currentConsecutiveUses: number
    maxConsecutiveUses: number | null
    consecutiveUseResetOnCooldownUpdate: boolean
    casterMustBeInRange: Array<number>

    requirements: unknown // for now unknown
}

export interface ItemEditable extends UsableComponentEditableFields {
    applies: Array<string>
    quantity: number
    isConsumable: boolean
}

export interface WeaponEditable extends ItemEditable {
    costToSwitch: number
}

export interface StatusEffectEditable extends CommonEditableField {
    duration: number | null
    static: boolean

    autoMessages: boolean
    isVisible: boolean
    activatesOnApply: boolean

    owner: null | unknown // entity, but unknown for now
    updateType: string
    activationType: string
}

export interface SpellEditable extends UsableComponentEditableFields {}

export type InventoryEditable = Array<ItemEditable & { descriptor: string }>
export type WeaponryEditable = Array<WeaponEditable & { isActive: boolean; descriptor: string }>
export type SpellBookEditable = {
    knownSpells: Array<SpellEditable & { isActive: boolean; descriptor: string }>
    maxActiveSpells: number | null
}
export type StatusEffectsEditable = Array<StatusEffectEditable & { descriptor: string }>

export type CharacterDataEditable = {
    inventory: InventoryEditable
    weaponry: WeaponryEditable
    spellBook: SpellBookEditable
    statusEffects: StatusEffectsEditable

    attributes: { [attribute: string]: number }

    states: { [state: string]: number }
    addedCosts: { [cost: string]: number }

    decorations: GameComponentDecoration
    tags: Array<string>
    memory: GameComponentMemory
    id_?: string
}

interface CharacterInCombat {
    decorations: {
        name: string
        description: string
        sprite: string
    }
    attributes: {
        [descriptor: string]: number
    }
    spellBook: {
        maxActiveSpells: number | null
        knownSpells: Array<{
            descriptor: string
            turns_until_usage: number
            current_consecutive_uses: number
            is_active: boolean
        }>
    }
    inventory: Array<{
        descriptor: string
        quantity: number
        turns_until_usage: number
        current_consecutive_uses: number
    }>
    statusEffects: Array<{
        descriptor: string
        duration: number | null
    }>
    weaponry: Array<{
        descriptor: string
        quantity: number
        is_active: boolean
        turns_until_usage: number
        current_consecutive_uses: number
    }>
}

export interface MinifiedCombatPreset {
    nickName: string
    battlefield: {
        [square: string]: {
            descriptor: string
            character: CharacterInCombat
            control: ControlledBy
        }
    }
}
