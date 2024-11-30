import { CharacterPreset, ItemPreset, SpellPreset, StatusEffectPreset, WeaponPreset } from '@models/GameDLCData'
import {
    CharacterDataEditable,
    ItemEditable,
    SpellEditable,
    StatusEffectEditable,
    WeaponEditable,
} from '@models/GameEditorModels'
import { AttributeInfo } from '@models/ServerModels'
import { CharacterClass } from '@models/TypegooseModels'
import PackageManagerService from './PackageManagerService'

type ConvertedComponent<T> = Omit<T, 'descriptor'>
type ConvertedItem = ConvertedComponent<ItemEditable>
type ConvertedWeapon = ConvertedComponent<WeaponEditable>
type ConvertedSpell = ConvertedComponent<SpellEditable>
type ConvertedStatusEffect = ConvertedComponent<StatusEffectEditable>

class GameConversionService {
    private cachedConversions: {
        weapons: { [descriptor: string]: ConvertedWeapon }
        spells: { [descriptor: string]: ConvertedSpell }
        items: { [descriptor: string]: ConvertedItem }
        status_effects: { [descriptor: string]: ConvertedStatusEffect }
    } = {
        weapons: {},
        spells: {},
        items: {},
        status_effects: {},
    }

    public resetCache = () => {
        this.cachedConversions = {
            weapons: {},
            spells: {},
            items: {},
            status_effects: {},
        }
    }

    private getCachedWeapon = (descriptor: string): ConvertedWeapon | undefined => {
        return this.cachedConversions['weapons'][descriptor]
    }

    private getCachedItem = (descriptor: string): ConvertedItem | undefined => {
        return this.cachedConversions['items'][descriptor]
    }

    private getCachedSpell = (descriptor: string): ConvertedSpell | undefined => {
        return this.cachedConversions['spells'][descriptor]
    }

    private getCachedStatusEffect = (descriptor: string): ConvertedStatusEffect | undefined => {
        return this.cachedConversions['status_effects'][descriptor]
    }

    public convertItem = (item: ItemPreset): ConvertedItem => {
        try {
            return item
        } catch (error) {
            console.error('Error converting item', item, error)
            return {
                decorations: {
                    name: 'error',
                    sprite: 'error',
                    description: 'error',
                },
                quantity: 0,
                isConsumable: false,
                usageCost: null,
                turnsUntilUsage: 0,
                cooldownValue: null,
                currentConsecutiveUses: 0,
                maxConsecutiveUses: null,
                consecutiveUseResetOnCooldownUpdate: false,
                casterMustBeInRange: [],
                requirements: {},
                tags: [],
                memory: {},
            }
        }
    }

    public convertWeapon = (weapon: WeaponPreset): ConvertedWeapon => {
        try {
            return weapon
        } catch (error) {
            console.error('Error converting weapon', weapon, error)
            return {
                decorations: {
                    name: 'error',
                    sprite: 'error',
                    description: 'error',
                },
                quantity: 0,
                isConsumable: false,
                usageCost: null,
                turnsUntilUsage: 0,
                cooldownValue: null,
                currentConsecutiveUses: 0,
                maxConsecutiveUses: null,
                consecutiveUseResetOnCooldownUpdate: false,
                casterMustBeInRange: [],
                requirements: {},
                costToSwitch: 0,
                tags: [],
                memory: {},
            }
        }
    }

    public convertSpell = (spell: SpellPreset): ConvertedSpell => {
        try {
            return spell
        } catch (error) {
            console.error('Error converting spell', spell, error)
            return {
                decorations: {
                    name: 'error',
                    sprite: 'error',
                    description: 'error',
                },
                usageCost: null,
                turnsUntilUsage: 0,
                cooldownValue: null,
                currentConsecutiveUses: 0,
                maxConsecutiveUses: null,
                consecutiveUseResetOnCooldownUpdate: false,
                casterMustBeInRange: [],
                requirements: {},
                tags: [],
                memory: {},
            }
        }
    }

    public convertStatusEffect = (statusEffect: StatusEffectPreset): ConvertedStatusEffect => {
        try {
            return statusEffect
        } catch (error) {
            console.error('Error converting status effect', statusEffect, error)
            return {
                decorations: {
                    name: 'error',
                    sprite: 'error',
                    description: 'error',
                },
                duration: 0,
                memory: {},
                tags: [],
                static: false,
                autoMessages: false,
                isVisible: false,
                activatesOnApply: false,
                owner: null,
                updateType: 'error',
                activationType: 'error',
            }
        }
    }

    private filterUndefined = (value: unknown) => !!value

    public convertWeaponry = (weaponry: CharacterClass['weaponry']): CharacterDataEditable['weaponry'] => {
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
            .filter(this.filterUndefined) as CharacterDataEditable['weaponry']
    }

    public convertInventory = (inventory: CharacterClass['inventory']): CharacterDataEditable['inventory'] => {
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
            .filter(this.filterUndefined) as CharacterDataEditable['inventory']
    }

    public convertSpellbook = (spellbook: CharacterClass['spellBook']): CharacterDataEditable['spellBook'] => {
        return {
            knownSpells: spellbook.knownSpells
                .map(({ descriptor, isActive }) => {
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
                        return { ...converted, descriptor, isActive: isActive }
                    }
                })
                .filter(this.filterUndefined) as CharacterDataEditable['spellBook']['knownSpells'],
            maxActiveSpells: spellbook.maxActiveSpells,
        }
    }

    public convertStatusEffects = (
        status_effects: CharacterClass['statusEffects']
    ): CharacterDataEditable['statusEffects'] => {
        return status_effects
            .map(({ descriptor, duration }) => {
                const cached = this.getCachedStatusEffect(descriptor)
                if (cached) {
                    return { ...cached, duration: duration === null ? duration : `${duration}` }
                }
                const effect = PackageManagerService.getDLCStatusEffect(descriptor)
                if (!effect) {
                    return
                } else {
                    const converted = this.convertStatusEffect(effect)
                    this.cachedConversions['status_effects'][descriptor] = converted
                    return {
                        ...converted,
                        descriptor,
                        duration: duration === null ? duration : `${duration}`,
                    }
                }
            })
            .filter(this.filterUndefined) as CharacterDataEditable['statusEffects']
    }

    public convertAttributesFromModel = (character: CharacterClass) => {
        const attributes: AttributeInfo = {
            ...DEFAULT_CHARACTER_ATTRIBUTES,
            'builtins:will': character.abilitiesPoints.will ?? 0,
            'builtins:reflexes': character.abilitiesPoints.reflexes ?? 0,
            'builtins:strength': character.abilitiesPoints.strength ?? 0,
        }

        for (const attribute of character.attributes) {
            const { descriptor, value } = attribute
            attributes[descriptor] = value
        }
        return attributes
    }
    public convertCharacterModelToEditable = (characterModel: CharacterClass): CharacterDataEditable => {
        const info: CharacterDataEditable = {
            decorations: characterModel.decorations,
            attributes: {
                ...DEFAULT_CHARACTER_ATTRIBUTES,
                'builtins:will': characterModel.abilitiesPoints.will ?? 0,
                'builtins:reflexes': characterModel.abilitiesPoints.reflexes ?? 0,
                'builtins:strength': characterModel.abilitiesPoints.strength ?? 0,
            },

            spellBook: this.convertSpellbook(characterModel.spellBook),
            inventory: this.convertInventory(characterModel.inventory),
            weaponry: this.convertWeaponry(characterModel.weaponry),
            statusEffects: this.convertStatusEffects(characterModel.statusEffects),
            tags: [],
            memory: {},
            addedCosts: {
                ...DEFAULT_ADDITIONAL_COSTS,
            },
            states: {
                ...DEFAULT_CHARACTER_STATES,
            },
        }
        for (const attribute of characterModel.attributes) {
            const { descriptor, value } = attribute
            info.attributes[descriptor] = value
        }

        const restoreAttributes = (restorable: string, max: string) => {
            if (info.attributes[restorable] === 0) {
                info.attributes[restorable] = info.attributes[max]
            }
        }
        restoreAttributes('builtins:current_health', 'builtins:max_health')
        restoreAttributes('builtins:current_action_points', 'builtins:max_action_points')
        restoreAttributes('builtins:current_armor', 'builtins:base_armor')

        return info
    }

    public convertCharacterPresetToEditable = (characterPreset: CharacterPreset): CharacterDataEditable => {
        return {
            decorations: characterPreset.decorations,
            attributes: {
                ...DEFAULT_CHARACTER_ATTRIBUTES,
                ...(characterPreset.attributes ?? {}),
            },
            states: {
                ...DEFAULT_CHARACTER_STATES,
                ...(characterPreset.states ?? {}),
            },
            addedCosts: {
                ...DEFAULT_ADDITIONAL_COSTS,
                ...(characterPreset.addedCosts ?? {}),
            },
            spellBook: {
                knownSpells: ((characterPreset?.spellBook?.knownSpells ?? [])
                    .map(({ descriptor, isActive }) => {
                        const cached = this.getCachedSpell(descriptor)
                        if (cached) {
                            return { ...cached, descriptor, isActive }
                        }
                        const spell = PackageManagerService.getDLCSpell(descriptor)
                        if (!spell) {
                            return
                        } else {
                            const converted = this.convertSpell(spell)
                            this.cachedConversions['spells'][descriptor] = converted
                            return { ...converted, descriptor, isActive }
                        }
                    })
                    .filter(this.filterUndefined) ?? []) as CharacterDataEditable['spellBook']['knownSpells'],
                maxActiveSpells: characterPreset.spellBook.maxActiveSpells,
            },
            inventory: ((characterPreset?.inventory ?? [])
                .map(({ descriptor, quantity, turnsUntilUsage, currentConsecutiveUses }) => {
                    const cached = this.getCachedItem(descriptor)
                    if (cached) {
                        return {
                            ...cached,
                            descriptor,
                            quantity: quantity || 1,
                            currentConsecutiveUses: currentConsecutiveUses || 0,
                            turnsUntilUsage: turnsUntilUsage || 0,
                        }
                    }
                    const item = PackageManagerService.getDLCItem(descriptor)
                    if (!item) {
                        return
                    } else {
                        return {
                            ...this.convertItem(item),
                            descriptor,
                            quantity: quantity || 1,
                            currentConsecutiveUses: currentConsecutiveUses || 0,
                            turnsUntilUsage: turnsUntilUsage || 0,
                        }
                    }
                })
                .filter(this.filterUndefined) ?? []) as CharacterDataEditable['inventory'],
            weaponry: ((characterPreset?.weaponry ?? [])
                .map(({ descriptor, quantity, isActive, turnsUntilUsage, currentConsecutiveUses }) => {
                    const cached = this.getCachedWeapon(descriptor)
                    if (cached) {
                        return {
                            ...cached,
                            quantity: quantity || 1,
                            descriptor,
                            isActive: isActive || false,
                            currentConsecutiveUses: currentConsecutiveUses || 0,
                            turnsUntilUsage: turnsUntilUsage || 0,
                        }
                    }
                    const weapon = PackageManagerService.getDLCWeapon(descriptor)
                    if (!weapon) {
                        return
                    } else {
                        const converted = this.convertWeapon(weapon)
                        this.cachedConversions['weapons'][descriptor] = converted
                        return {
                            ...converted,
                            quantity: quantity || 1,
                            descriptor,
                            isActive: isActive || false,
                            currentConsecutiveUses: currentConsecutiveUses || 0,
                            turnsUntilUsage: turnsUntilUsage || 0,
                        }
                    }
                })
                .filter(this.filterUndefined) ?? []) as CharacterDataEditable['weaponry'],
            statusEffects: ((characterPreset?.statusEffects ?? [])
                .map(({ descriptor, duration }) => {
                    const cached = this.getCachedStatusEffect(descriptor)
                    if (cached) {
                        return { ...cached, duration: duration === null ? duration : `${duration}` }
                    }
                    const effect = PackageManagerService.getDLCStatusEffect(descriptor)
                    if (!effect) {
                        return
                    } else {
                        const converted = this.convertStatusEffect(effect)
                        this.cachedConversions['status_effects'][descriptor] = converted
                        return {
                            ...converted,
                            descriptor,
                            duration: duration === null ? duration : `${duration}`,
                        }
                    }
                })
                .filter(this.filterUndefined) ?? []) as CharacterDataEditable['statusEffects'],
            tags: characterPreset.tags ?? [],
            memory: characterPreset.memory ?? {},
        }
    }
}

const DEFAULT_ADDITIONAL_COSTS: { [cost: string]: number } = {
    'builtins:move': 1,
    'builtins:spell': 1,
    'builtins:use': 1,
    'builtins:pass': 0,
}

const DEFAULT_CHARACTER_STATES: { [state: string]: number } = {
    'builtins:can_move': 1,
    'builtins:can_act': 1,
    'builtins:can_attack': 1,
    'builtins:can_change_weapon': 1,
    'builtins:can_spell': 1,
    'builtins:can_item': 1,
    'builtins:damageable': 1,
    'builtins:visible': 1,
    'builtins:adrenaline': 0,
    'builtins:alive': 1,
}

const DEFAULT_CHARACTER_ATTRIBUTES: { [attribute: string]: number } = {
    'builtins:current_health': 0,
    'builtins:max_health': 0,
    'builtins:current_action_points': 0,
    'builtins:max_action_points': 0,
    'builtins:current_armor': 0,
    'builtins:base_armor': 0,
    'builtins:athletics': 0,
    'builtins:caution': 0,
    'builtins:dexterity': 0,
    'builtins:persuasion': 0,
    'builtins:medicine': 0,
    'builtins:will': 0,
    'builtins:reflexes': 0,
    'builtins:strength': 0,
    ...['nature', 'fire', 'water', 'earth', 'air', 'light', 'dark', 'physical'].reduce(
        (acc, element) => {
            acc[`builtins:${element}_defense`] = 0
            acc[`builtins:${element}_attack`] = 0
            return acc
        },
        {} as { [attribute: string]: number }
    ),
}

export default new GameConversionService()
