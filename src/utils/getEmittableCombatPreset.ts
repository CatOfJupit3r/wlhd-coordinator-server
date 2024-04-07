import { GamePreset } from '../models/ServerModels'
import DatabaseService from '../services/DatabaseService'

export const getEmittableCombatPreset = async (combatPreset: string): Promise<GamePreset | null> => {
    const result: GamePreset = {
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
        const customEntity = await DatabaseService.getEntity(path)
        if (!customEntity) {
            throw new Error('Entity not found')
        }
        result.custom_entities[path] = customEntity
    }

    return result
}
