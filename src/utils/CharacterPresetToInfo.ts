import { EntityInfoFull } from '../models/ClientModels'
import { CharacterPreset } from '../models/ServerModels'

export const characterPresetToInfo = (characterModel: CharacterPreset): EntityInfoFull => {
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
