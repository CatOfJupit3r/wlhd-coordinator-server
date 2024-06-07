import { EntityInfoFull } from '../models/ClientModels'
import { CharacterInfo } from '../models/InfoModels'
import { AttributeInfo, CharacterPreset } from '../models/ServerModels'
import { CharacterClass } from '../models/TypegooseModels'

export const characterPresetToInfoFull = (characterModel: CharacterPreset): EntityInfoFull => {
    const info: EntityInfoFull = {
        decorations: characterModel.decorations,
        square: { line: '0', column: '0' },
        attributes: {},
        items: [],
        weapons: [],
        spells: [],
        status_effects: [],
    }

    return info
}

export const characterModelToPreset = (characterModel: CharacterClass): CharacterPreset => {
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
        spell_book: [],
        status_effects: [],
    }
    for (const attribute of characterModel.attributes) {
        const { dlc, descriptor, value } = attribute
        const attributeKey = `${dlc}:${descriptor}`
        preset.attributes[attributeKey] = (preset.attributes[attributeKey] || 0) + value
    }
    for (const spell of characterModel.spellBook) {
        if (characterModel.spellLayout.layout.includes(spell.descriptor)) {
            preset.spell_book.push({
                descriptor: spell.descriptor,
            })
        }
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

export const characterModelToInfo = (
    characterModel: CharacterClass,
    decorationsAsDescriptors?: boolean
): CharacterInfo => {
    const info: CharacterInfo = {
        descriptor: characterModel.descriptor,
        controlledBy: null,
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
        spellBook: [],
        spellLayout: characterModel.spellLayout.layout,
        inventory: [],
        weaponry: [],
    }

    for (const attribute of characterModel.attributes) {
        const { dlc, descriptor, value } = attribute
        const attributeKey = `${dlc}:${descriptor}`
        info.attributes[attributeKey] = String(value)
    }

    for (const spell of characterModel.spellBook) {
        info.spellBook.push({
            descriptor: spell.descriptor,
            conflictsWith: spell.conflictsWith,
            requiresToUse: spell.requiresToUse,
        })
    }

    for (const item of characterModel.inventory) {
        info.inventory.push({
            descriptor: item.descriptor,
            count: item.quantity,
        })
    }

    for (const weapon of characterModel.weaponry) {
        info.weaponry.push({
            descriptor: weapon.descriptor,
            count: weapon.quantity,
        })
    }

    return info
}

export const getAttributesFromCharacterModel = (character: CharacterClass) => {
    const attributes: AttributeInfo = {
        ...Object.fromEntries(Object.entries(DEFAULT_CHARACTER_ATTRIBUTES).map(([key, value]) => [key, String(value)])),
        'builtins:will': String(character.abilitiesPoints.will || 0),
        'builtins:reflexes': String(character.abilitiesPoints.reflexes || 0),
        'builtins:strength': String(character.abilitiesPoints.strength || 0),
    }

    for (const attribute of character.attributes) {
        const { dlc, descriptor, value } = attribute
        const attributeKey = `${dlc}:${descriptor}`
        attributes[attributeKey] = String(value)
    }
    return attributes
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
