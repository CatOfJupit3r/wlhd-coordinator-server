import { CharacterPreset } from '../models/ServerModels'
import { CharacterClass } from '../models/TypegooseModels'

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
