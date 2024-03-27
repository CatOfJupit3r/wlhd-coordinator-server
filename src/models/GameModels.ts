export interface Battlefield {
    field: Array<Array<string>>
    columns: Array<string>
    lines: Array<string>
    connectors: string
    separators: string
    field_pawns: {
        [key: string]: string
    }
}

export interface EntityTooltip {
    name: string // i18n translatable name
    square: string // 'x/y', where x - column, y - line
    current_health: string
    max_health: string
    current_action_points: string
    max_action_points: string
    current_armor: string
    base_armor: string
    status_effects: [
        {
            name: string
            duration: string
        },
    ]
}

export interface EntityInformation extends EntityTooltip {
    items: [
        {
            name: string
            count: number // how many of given item entity has
            consumable: boolean // if item is consumable
            cost: number // how much it costs to use this item
            turns_till_usage: number // how many turns it takes to use this item next time
            cooldown: number // how many turns it takes to use this item again
        },
    ]
    spells: [
        {
            name: string
            cost: number
            turns_till_usage: number
            cooldown: number
        },
    ]
    weapons: [
        {
            name: string
            cost: number
            turns_till_usage: number
            cooldown: number
            consumable: boolean
            count: number
        },
    ]
    attributes: { [attribute: string]: string }
}

export interface BattlefieldEntitiesInformation {
    [square: string]: EntityInformation | null // there either is an entity with info or null
}

export interface GameStateMessage {
    main_string: string
    format_args?: {
        [key: string]: string | GameStateMessage
    }
}

export interface GameMessagesContainer {
    [key: string]: Array<GameStateMessage>
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
    field: Array<Array<string>>
    field_pawns: {
        [square: string]: {
            entity_preset: { source: 'dlc' | 'embedded'; name: string }
            owner: { type: 'player'; id: string | null } | { type: 'ai'; id: string } | { type: 'game_logic' }
        }
    }
    // we can send presets of entities that are not installed by dlc.
    // For this, define field_pawn with source: 'embedded' and 'name' of a key in this object
    custom_entities:
        | {
              [key: string]: any
          }
        | undefined
}
