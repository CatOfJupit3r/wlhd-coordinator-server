export interface Manifest {
    title: string
    description: string
    version: string
    descriptor: string
    author: string
    source: string // git repository url
}

export interface GameServerStatus {
    installed: Array<Manifest>
}

interface CommonPresetField {
    decorations: {
        // descriptors rather than values
        name: string
        sprite: string
        description: string
    }
    method_variables: { [variable: string]: unknown }
    usage_cost: number | null
    cooldown: number | null
    effect_hook: string
    max_consecutive_uses: number | null
    caster_must_be_in_range: Array<number>
    consecutive_use_reset_on_cooldown_update: boolean
}

export interface SpellPreset extends CommonPresetField {
    [other: string]: unknown
}

export interface ItemPreset extends CommonPresetField {
    applies: Array<string>
    quantity: number
    is_consumable: boolean
    [other: string]: unknown
}

export interface WeaponPreset extends ItemPreset {
    cost_to_switch: number
    [other: string]: unknown
}

export interface StatusEffectPreset {
    decorations: {
        // descriptors rather than values
        name: string
        sprite: string
        description: string
    }
    duration: number | null
    static: boolean
    visibility: boolean
    activate_on_use: boolean
    update_type: string
    activation_type: string
    method_variables: { [variable: string]: unknown }
    method_hooks: {
        apply: string | null
        update: string | null
        dispel: string | null
        activate: string | null
    }
    [other: string]: unknown
}

export interface EntityPreset {
    decorations: {
        name: string
        sprite: string
        description: string
    }
    race_of_creature: string
    attributes: {
        [attribute: string]: number
    }
    spell_book: Array<{
        descriptor: string
        current_cooldown: number
        current_consecutive_uses: number
    }>
    status_effects: Array<{
        descriptor: string
        duration: string
    }>
    inventory: Array<{
        descriptor: string
        quantity: number
        is_active?: boolean
    }>
    weaponry: Array<{
        descriptor: string
        quantity: number
        is_active?: boolean
    }>
    states: {
        [state: string]: number
    }
    cost_dictionaries: {
        [action: string]: number
    }

    [other: string]: unknown
}

export type DLCPreset = SpellPreset | WeaponPreset | ItemPreset | StatusEffectPreset | EntityPreset
