import { Battlefield, GameStateContainer } from './ServerModels'
import { TranslatableString } from './Translation'

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
    name: TranslatableString
    square: { line: string; column: string }
    health: { current: string; max: string }
    action_points: { current: string; max: string }
    armor: { current: string; base: string }
    status_effects: Array<{
        descriptor: TranslatableString
        duration: string
    }>
}

export interface EntityInfoTurn {
    name: string
    square: { line: string; column: string }
    action_points: { current: number; max: number }
}

export interface EntityInfoFull {
    name: string
    square: { line: string; column: string }
    attributes: { [attribute: string]: string }

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
        descriptor: TranslatableString
        duration: number
    }>
}
