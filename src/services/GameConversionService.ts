import { EntityInfoFull } from '../models/ClientModels'
import { ItemPreset, SpellPreset, StatusEffectPreset, WeaponPreset } from '../models/GameDLCData'
import { CharacterInfo } from '../models/InfoModels'
import {
    AttributeInfo,
    CharacterPreset,
    ItemInfo,
    SpellInfo,
    StatusEffectInfo,
    WeaponInfo,
} from '../models/ServerModels'
import { CharacterClass } from '../models/TypegooseModels'
import PackageManagerService from './PackageManagerService'

class GameConversionService {
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

    public resetCache = () => {
        this.cachedConversions = {
            weapons: {},
            spells: {},
            items: {},
            status_effects: {},
        }
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
                isActive: false,
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
                isActive: false,
            } as SpellInfo
        }
    }

    public convertStatusEffect = (statusEffect: StatusEffectPreset): StatusEffectInfo => {
        try {
            const { decorations, duration, descriptor } = statusEffect
            return {
                descriptor,
                decorations,
                duration: duration === null ? duration : `${duration}`,
            } as StatusEffectInfo
        } catch (error) {
            console.error('Error converting status effect', statusEffect, error)
            return {
                descriptor: 'error',
                decorations: {
                    name: 'error',
                    sprite: 'error',
                    description: 'error',
                },
                duration: null,
            } as StatusEffectInfo
        }
    }

    private filterUndefined = (value: unknown) => !!value

    public convertWeaponry = (weaponry: CharacterClass['weaponry']): Array<WeaponInfo> => {
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
    public convertInventory = (inventory: CharacterClass['inventory']): Array<ItemInfo> => {
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

    public convertSpellbook = (spellbook: CharacterClass['spellBook']): CharacterInfo['spellBook'] => {
        return {
            spells: spellbook.knownSpells
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
                .filter(this.filterUndefined) as Array<SpellInfo>,
            maxActiveSpells: spellbook.maxActiveSpells,
        }
    }

    public convertStatusEffects = (status_effects: CharacterClass['statusEffects']): Array<StatusEffectInfo> => {
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
            .filter(this.filterUndefined) as Array<StatusEffectInfo>
    }

    public convertAttributesFromModel = (character: CharacterClass) => {
        const attributes: AttributeInfo = {
            ...Object.fromEntries(
                Object.entries(DEFAULT_CHARACTER_ATTRIBUTES).map(([key, value]) => [key, String(value)])
            ),
            'builtins:will': String(character.abilitiesPoints.will || 0),
            'builtins:reflexes': String(character.abilitiesPoints.reflexes || 0),
            'builtins:strength': String(character.abilitiesPoints.strength || 0),
        }

        for (const attribute of character.attributes) {
            const { descriptor, value } = attribute
            attributes[descriptor] = String(value)
        }
        return attributes
    }

    public convertCharacterModelToInfo = (
        characterModel: CharacterClass,
        decorationsAsDescriptors?: boolean
    ): CharacterInfo => {
        const info: CharacterInfo = {
            descriptor: characterModel.descriptor,
            decorations: decorationsAsDescriptors
                ? {
                      name: `coordinator:${characterModel.descriptor}.name`,
                      description: `coordinator:${characterModel.descriptor}.description`,
                      sprite: characterModel.decorations.sprite,
                  }
                : characterModel.decorations,
            attributes: {
                ...Object.fromEntries(
                    Object.entries(DEFAULT_CHARACTER_ATTRIBUTES).map(([key, value]) => [key, String(value)])
                ),
                'builtins:will': String(characterModel.abilitiesPoints.will || 0),
                'builtins:reflexes': String(characterModel.abilitiesPoints.reflexes || 0),
                'builtins:strength': String(characterModel.abilitiesPoints.strength || 0),
            },

            spellBook: this.convertSpellbook(characterModel.spellBook),
            inventory: this.convertInventory(characterModel.inventory),
            weaponry: this.convertWeaponry(characterModel.weaponry),
            statusEffects: this.convertStatusEffects(characterModel.statusEffects),
        }
        for (const attribute of characterModel.attributes) {
            const { descriptor, value } = attribute
            info.attributes[descriptor] = String(value)
        }
        return info
    }

    public convertCharacterPresetToInfoFull = (characterModel: CharacterPreset): EntityInfoFull => {
        const info: EntityInfoFull = {
            decorations: characterModel.decorations,
            square: { line: '0', column: '0' },
            attributes: {},
            inventory: [],
            weaponry: [],
            spellBook: {
                spells: [],
                maxActiveSpells: null,
            },
            statusEffects: [],
        }

        return info
    }

    public convertCharacterModelToPreset = (characterModel: CharacterClass): CharacterPreset => {
        const preset: CharacterPreset = {
            descriptor: `coordinator:${characterModel.descriptor}`,
            decorations: {
                name: `coordinator:${characterModel.descriptor}.name`,
                description: `coordinator:${characterModel.descriptor}.description`,
                sprite: `coordinator:${characterModel.descriptor}.sprite`,
            },
            attributes: {
                ...DEFAULT_CHARACTER_ATTRIBUTES,
                'builtins:will': characterModel.abilitiesPoints.will || 0,
                'builtins:reflexes': characterModel.abilitiesPoints.reflexes || 0,
                'builtins:strength': characterModel.abilitiesPoints.strength || 0,
            },
            inventory: [],
            weaponry: [],
            spell_book: {
                spells: [],
                max_active_spells: null,
            },
            status_effects: [],
        }
        for (const attribute of characterModel.attributes) {
            const { descriptor, value } = attribute
            preset.attributes[descriptor] = (preset.attributes[descriptor] || 0) + value
        }
        const { knownSpells, maxActiveSpells } = characterModel.spellBook
        preset.spell_book.max_active_spells = typeof maxActiveSpells !== 'undefined' ? maxActiveSpells : null
        for (const spell of knownSpells) {
            const spell_preset: CharacterPreset['spell_book']['spells'][number] = {
                descriptor: spell.descriptor,
                _is_active: spell.isActive,
            }
            preset.spell_book.spells.push(spell_preset)
        }
        for (const item of characterModel.inventory) {
            preset.inventory.push({
                descriptor: item.descriptor,
                quantity: item.quantity,
            })
        }
        for (const weapon of characterModel.weaponry) {
            preset.weaponry.push({
                descriptor: weapon.descriptor,
                quantity: weapon.quantity,
            })
        }
        for (const statusEffect of characterModel.statusEffects) {
            preset.status_effects.push({
                descriptor: statusEffect.descriptor,
                duration: statusEffect.duration,
            })
        }
        return preset
    }
}

const DEFAULT_CHARACTER_ATTRIBUTES: { [attribute: string]: number } = {
    'builtins:current_health': 0,
    'builtins:max_health': 0,
    'builtins:current_action_points': 0,
    'builtins:max_action_points': 0,
    'builtins:current_armor': 0,
    'builtins:base_armor': 0,
    'builtins:weapon_bonus_damage': 0,
    'builtins:weapon_healing_damage': 0,
    'builtins:athletics': 0,
    'builtins:caution': 0,
    'builtins:dexterity': 0,
    'builtins:persuasion': 0,
    'builtins:medicine': 0,
    'builtins:will': 0,
    'builtins:reflexes': 0,
    'builtins:strength': 0,
    ...['nature', 'fire', 'water', 'earth', 'air', 'light', 'dark'].reduce(
        (acc, element) => {
            acc[`builtins:${element}_defense`] = 0
            acc[`builtins:${element}_attack`] = 0
            return acc
        },
        {} as { [attribute: string]: number }
    ),
}

export default new GameConversionService()
