import { EntityInfoFull } from '../models/ClientModels'
import { CharacterInfo } from '../models/InfoModels'
import { CharacterPreset } from '../models/ServerModels'
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

export const characterModelToInfo = (characterModel: CharacterClass): CharacterInfo => {
    const info: CharacterInfo = {
        descriptor: characterModel.descriptor,
        controlledBy: null,
        attributes: {},
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
