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

interface MemoryType {
    type: string
    value: unknown
    display_name: string
    internal: boolean
}

interface DiceMemory extends MemoryType {
    type: 'dice'
    value: {
        sides: number
        times: number
    }
}

interface StringMemory extends MemoryType {
    type: 'string'
    value: string
}

interface ComponentIDMemory extends MemoryType {
    type: 'component_id'
    value: string
}

interface NumberMemory extends MemoryType {
    type: 'number'
    value: number
}

interface BooleanMemory extends MemoryType {
    type: 'boolean'
    value: boolean
}

type PossibleMemory = DiceMemory | StringMemory | NumberMemory | BooleanMemory | ComponentIDMemory | MemoryType

export interface GameComponentMemory {
    [variable: string]: PossibleMemory
}

export interface GameComponentDecoration {
    name: string
    sprite: string
    description: string
}

interface CommonPresetField {
    decorations: GameComponentDecoration
    memory: GameComponentMemory
    tags: Array<string>
}

interface UsableComponentPresetFields extends CommonPresetField {
    usageCost: number | null
    turnsUntilUsage: number
    cooldownValue: number | null
    currentConsecutiveUses: number
    maxConsecutiveUses: number | null
    consecutiveUseResetOnCooldownUpdate: boolean
    casterMustBeInRange: Array<number>

    requirements: unknown // for now unknown
}

export interface SpellPreset extends UsableComponentPresetFields {}

export interface ItemPreset extends UsableComponentPresetFields {
    applies: Array<string>
    quantity: number
    isConsumable: boolean
}

export interface WeaponPreset extends ItemPreset {
    costToSwitch: number
}

export interface StatusEffectPreset extends CommonPresetField {
    duration: number | null
    static: boolean

    autoMessages: boolean
    isVisible: boolean
    activatesOnApply: boolean

    owner: null | unknown // entity, but unknown for now
    updateType: string
    activationType: string
}

interface CommonSaveField {
    descriptor: string
    id_?: string
}

type SpellSaveSource = Partial<SpellPreset> & CommonSaveField & { isActive: boolean; effectHook?: string }

type ItemSaveSource = Partial<ItemPreset> & CommonSaveField & { effectHook?: string }

type WeaponSaveSource = Partial<WeaponPreset> & CommonSaveField & { isActive: boolean; effectHook?: string }

type StatusEffectSaveSource = Partial<StatusEffectPreset> & CommonSaveField

// Character Preset are uncannily similar to Character Save Source. The only difference is absence of id_ in Character Preset
// Although id_ is not required in Character Save Source, if inner presets refer to id_ '0', it should be assumed to be the character itself
export interface CharacterPreset extends CommonPresetField {
    attributes: {
        [attribute: string]: number
    }
    spellBook: {
        knownSpells: Array<SpellSaveSource>
        maxActiveSpells: number | null
    }
    statusEffects: Array<StatusEffectSaveSource>
    inventory: Array<ItemSaveSource>
    weaponry: Array<WeaponSaveSource>
    states: {
        [state: string]: number
    }
    addedCosts: {
        [cost: string]: number
    }
}

export type DLCPreset = SpellPreset | WeaponPreset | ItemPreset | StatusEffectPreset | CharacterPreset
