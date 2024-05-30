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
            ...characterModel.attributes,
            'builtins:will': (characterModel.attributes.will || 0) + (characterModel.abilitiesPoints.will || 0),
            'builtins:reflexes':
                (characterModel.attributes.reflexes || 0) + (characterModel.abilitiesPoints.reflexes || 0),
            'builtins:strength':
                (characterModel.attributes.strength || 0) + (characterModel.abilitiesPoints.strength || 0),
        },
        inventory: [],
        weaponry: [],
        spellbook: [],
        status_effects: [],
    }
    for (const attribute of characterModel.customAttributes) {
        const { dlc, descriptor, value } = attribute
        preset.attributes[`${dlc}:${descriptor}`] = value
    }
    for (const spell of characterModel.spellBook) {
        if (characterModel.spellLayout.layout.includes(spell.descriptor)) {
            preset.spellbook.push({
                descriptor: spell.descriptor,
            })
        }
    }
    return preset
}
