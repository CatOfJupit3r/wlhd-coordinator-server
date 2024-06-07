import { ItemPreset, SpellPreset, StatusEffectPreset, WeaponPreset } from '../models/GameDLCData'
import { ItemInfo, SpellInfo, StatusEffectInfo, WeaponInfo } from '../models/ServerModels'
import { CharacterClass } from '../models/TypegooseModels'
import PackageManagerService from './PackageManagerService'

class DLCConversionService {
    private cachedConversions: {
        weapons: { [descriptor: string]: WeaponInfo }
        spells: { [descriptor: string]: SpellInfo }
        items: { [descriptor: string]: ItemInfo }
        status_effects: { [descriptor: string]: StatusEffectInfo }
    } = {
        weapons: {},
        spells: {},
        items: {},
        status_effects: {},
    }

    private getCachedWeapon = (descriptor: string): WeaponInfo | undefined => {
        return this.cachedConversions['weapons'][descriptor]
    }

    private getCachedItem = (descriptor: string): ItemInfo | undefined => {
        return this.cachedConversions['items'][descriptor]
    }

    private getCachedSpell = (descriptor: string): SpellInfo | undefined => {
        return this.cachedConversions['spells'][descriptor]
    }

    private getCachedStatusEffect = (descriptor: string): StatusEffectInfo | undefined => {
        return this.cachedConversions['status_effects'][descriptor]
    }

    public convertItem = (item: ItemPreset): ItemInfo => {
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

    public convertWeapon = (weapon: WeaponPreset): WeaponInfo => {
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

    public convertSpell = (spell: SpellPreset): SpellInfo => {
        try {
            const { descriptor, decorations, usage_cost, caster_must_be_in_range, cooldown, max_consecutive_uses } =
                spell
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

    public convertStatusEffect = (statusEffect: StatusEffectPreset): StatusEffectInfo => {
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

    private filterUndefined = (value: unknown) => !!value

    public convertWeaponry = async (weaponry: CharacterClass['weaponry']): Promise<Array<WeaponInfo>> => {
        return weaponry
            .map(({ descriptor, quantity }) => {
                const cached = this.getCachedWeapon(descriptor)
                if (cached) {
                    return { ...cached, quantity, descriptor }
                }
                const weapon = PackageManagerService.getDLCWeapon(descriptor)
                if (!weapon) {
                    return
                } else {
                    const converted = this.convertWeapon(weapon)
                    this.cachedConversions['weapons'][descriptor] = converted
                    return { ...converted, quantity, descriptor }
                }
            })
            .filter(this.filterUndefined) as Array<WeaponInfo>
    }
    public convertInventory = async (inventory: CharacterClass['inventory']): Promise<Array<ItemInfo>> => {
        return inventory
            .map(({ descriptor, quantity }) => {
                const cached = this.getCachedItem(descriptor)
                if (cached) {
                    return { ...cached, quantity, descriptor }
                }
                const item = PackageManagerService.getDLCItem(descriptor)
                if (!item) {
                    return
                } else {
                    return { ...this.convertItem(item), quantity, descriptor }
                }
            })
            .filter(this.filterUndefined) as Array<ItemInfo>
    }

    public convertSpellbook = async (spellbook: CharacterClass['spellBook']): Promise<Array<SpellInfo>> => {
        return spellbook
            .map(({ descriptor }) => {
                const cached = this.getCachedSpell(descriptor)
                if (cached) {
                    return { ...cached, descriptor }
                }
                const spell = PackageManagerService.getDLCSpell(descriptor)
                if (!spell) {
                    return
                } else {
                    const converted = this.convertSpell(spell)
                    this.cachedConversions['spells'][descriptor] = converted
                    return { ...converted, descriptor }
                }
            })
            .filter(this.filterUndefined) as Array<SpellInfo>
    }

    public convertStatusEffects = async (
        status_effects: CharacterClass['statusEffects']
    ): Promise<Array<StatusEffectInfo>> => {
        return status_effects
            .map(({ descriptor, duration }) => {
                const cached = this.getCachedStatusEffect(descriptor)
                if (cached) {
                    return { ...cached, duration: `${duration}` }
                }
                const effect = PackageManagerService.getDLCStatusEffect(descriptor)
                if (!effect) {
                    return
                } else {
                    const converted = this.convertStatusEffect(effect)
                    this.cachedConversions['status_effects'][descriptor] = converted
                    return {
                        ...converted,
                        duration: `${duration}`,
                    }
                }
            })
            .filter(this.filterUndefined) as Array<StatusEffectInfo>
    }
}

export default new DLCConversionService()
