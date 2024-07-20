import { BadRequest, NotFound } from '../models/ErrorModels'
import { GamePreset } from '../models/ServerModels'
import DatabaseService from '../services/DatabaseService'

import GameConversionService from '../services/GameConversionService'

const cookPresetFromDB = async (combatPreset: string): Promise<GamePreset | null> => {
    const result: GamePreset = {
        round_counter: 0,
        turn_info: {
            current_entity: '',
            turn_queue: [],
        },
        field_pawns: {},
        custom_entities: {},
    }
    const presetFromDB = await DatabaseService.getCombatPreset(combatPreset)
    if (!presetFromDB) {
        return null
    }

    for (const pawn of presetFromDB.field) {
        const { square, source, path, controlled_by } = pawn
        result.field_pawns[square] = {
            entity_preset: {
                source,
                name: path,
            },
            owner: controlled_by,
        }
        if (source === 'embedded') {
            const customEntity = await DatabaseService.getCharacterByDescriptor(path)
            if (!customEntity) throw new NotFound('Entity not found')
            result.custom_entities[path] = GameConversionService.convertCharacterModelToPreset(customEntity)
        }
    }
    return result
}

const cookPresetFromRequest = async (combatPreset: {
    field: {
        [square: string]: {
            path: string
            source: 'dlc' | 'embedded'
            controlledBy:
                | {
                      type: 'player'
                      id: string | null
                  }
                | {
                      type: 'ai'
                      id: string
                  }
                | {
                      type: 'game_logic'
                  }
        }
    }
}): Promise<GamePreset> => {
    const result: GamePreset = {
        round_counter: 0,
        turn_info: {
            current_entity: '',
            turn_queue: [],
        },
        field_pawns: {},
        custom_entities: {},
    }
    for (const [square, { path, source, controlledBy }] of Object.entries(combatPreset.field)) {
        result.field_pawns[square] = {
            entity_preset: {
                source,
                name: path,
            },
            owner: controlledBy,
        }
        if (source === 'embedded') {
            const customEntity = await DatabaseService.getCharacterByDescriptor(path)
            if (!customEntity) throw new NotFound('Entity not found')
            result.custom_entities[path] = GameConversionService.convertCharacterModelToPreset(customEntity)
        }
    }
    return result
}

export const getEmittableCombatPreset = async (
    combatPreset: any,
    type: 'importable' | 'requested' = 'requested'
): Promise<GamePreset | null> => {
    if (type === 'importable') {
        return await cookPresetFromDB(combatPreset)
    } else if (type === 'requested') {
        return await cookPresetFromRequest(combatPreset)
    } else {
        throw new BadRequest('Unknown type. Use "importable" or "posted". Provided: ' + type)
    }
}
