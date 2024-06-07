import { ItemPreset, SpellPreset, StatusEffectPreset, WeaponPreset } from '../models/GameDLCData'
import { ItemInfo, SpellInfo, StatusEffectInfo, WeaponInfo } from '../models/ServerModels'
import { CharacterClass } from '../models/TypegooseModels'
import PackageManagerService from '../services/PackageManagerService'

const filterUndefined = (value: unknown) => !!value

export const convertItem = (item: ItemPreset): ItemInfo => {
    try {
        const {
            descriptor,
            decorations,
            usage_cost,
            is_consumable,
            caster_must_be_in_range,
            cooldown,
            max_consecutive_uses,
        } = item
        return {
            descriptor,
            decorations,
            cost: usage_cost,
            uses: {
                current: 0,
                max: max_consecutive_uses,
            },
            consumable: is_consumable,
            quantity: 1,
            user_needs_range: caster_must_be_in_range,
            cooldown: {
                current: 0,
                max: cooldown,
            },
        } as ItemInfo
    } catch (error) {
        console.error('Error converting item', item, error)
        return {
            descriptor: 'error',
            decorations: {
                name: 'error',
                sprite: 'error',
                description: 'error',
            },
            cost: 0,
            uses: {
                current: 0,
                max: 0,
            },
            user_needs_range: [],
            cooldown: {
                current: 0,
                max: 0,
            },
            quantity: 0,
            consumable: false,
        } as ItemInfo
    }
}

export const convertWeapon = (weapon: WeaponPreset): WeaponInfo => {
    try {
        const {
            descriptor,
            decorations,
            usage_cost,
            is_consumable,
            caster_must_be_in_range,
            cooldown,
            max_consecutive_uses,
        } = weapon
        return {
            descriptor,
            decorations,
            cost: usage_cost,
            uses: {
                current: 0,
                max: max_consecutive_uses,
            },
            consumable: is_consumable,
            quantity: 1,
            user_needs_range: caster_must_be_in_range,
            cooldown: {
                current: 0,
                max: cooldown,
            },
            isActive: false,
        } as WeaponInfo
    } catch (error) {
        console.error('Error converting weapon', weapon, error)
        return {
            descriptor: 'error',
            decorations: {
                name: 'error',
                sprite: 'error',
                description: 'error',
            },
            cost: 0,
            uses: {
                current: 0,
                max: 0,
            },
            user_needs_range: [],
            cooldown: {
                current: 0,
                max: 0,
            },
            quantity: 0,
            consumable: false,
            isActive: false,
        } as WeaponInfo
    }
}

export const convertSpell = (spell: SpellPreset): SpellInfo => {
    try {
        const { descriptor, decorations, usage_cost, caster_must_be_in_range, cooldown, max_consecutive_uses } = spell
        return {
            descriptor,
            decorations,
            cost: usage_cost,
            uses: {
                current: 0,
                max: max_consecutive_uses,
            },
            user_needs_range: caster_must_be_in_range,
            cooldown: {
                current: 0,
                max: cooldown,
            },
        } as SpellInfo
    } catch (error) {
        console.error('Error converting spell', spell, error)
        return {
            descriptor: 'error',
            decorations: {
                name: 'error',
                sprite: 'error',
                description: 'error',
            },
            cost: 0,
            uses: {
                current: 0,
                max: 0,
            },
            user_needs_range: [],
            cooldown: {
                current: 0,
                max: 0,
            },
        } as SpellInfo
    }
}

export const convertStatusEffect = (statusEffect: StatusEffectPreset): StatusEffectInfo => {
    try {
        const { decorations, duration } = statusEffect
        return {
            decorations,
            duration: `${duration}`,
        } as StatusEffectInfo
    } catch (error) {
        console.error('Error converting status effect', statusEffect, error)
        return {
            decorations: {
                name: 'error',
                sprite: 'error',
                description: 'error',
            },
            duration: '0',
        } as StatusEffectInfo
    }
}

export const convertWeaponry = async (weaponry: CharacterClass['weaponry']): Promise<Array<WeaponInfo>> => {
    return weaponry
        .map(({ descriptor, quantity }) => {
            const weapon = PackageManagerService.getDLCWeapon(descriptor)
            if (!weapon) {
                return
            } else {
                return { ...convertWeapon(weapon), quantity }
            }
        })
        .filter(filterUndefined) as Array<WeaponInfo>
}
export const convertInventory = async (inventory: CharacterClass['inventory']): Promise<Array<ItemInfo>> => {
    return inventory
        .map(({ descriptor, quantity }) => {
            const item = PackageManagerService.getDLCItem(descriptor)
            if (!item) {
                return
            } else {
                return { ...convertItem(item), quantity }
            }
        })
        .filter(filterUndefined) as Array<ItemInfo>
}

export const convertSpellbook = async (spellbook: CharacterClass['spellBook']): Promise<Array<SpellInfo>> => {
    return spellbook
        .map(({ descriptor }) => {
            const spell = PackageManagerService.getDLCSpell(descriptor)
            if (!spell) {
                return
            } else {
                return {
                    ...convertSpell(spell),
                }
            }
        })
        .filter(filterUndefined) as Array<SpellInfo>
}

export const convertStatusEffects = async (
    status_effects: CharacterClass['statusEffects']
): Promise<Array<StatusEffectInfo>> => {
    return status_effects
        .map(({ descriptor, duration }) => {
            const effect = PackageManagerService.getDLCStatusEffect(descriptor)
            if (!effect) {
                return
            } else {
                return {
                    ...convertStatusEffect(effect),
                    duration: `${duration}`,
                }
            }
        })
        .filter(filterUndefined) as Array<StatusEffectInfo>
}
