import { Request, Response } from 'express'
import { NotFound } from '../models/ErrorModels'
import CombatEditorService from '../services/GameServerService'
import InputValidator from '../services/InputValidator'
import PackageManagerService from '../services/PackageManagerService'

class CombatEditorController {
    async getLoadedItems(req: Request, res: Response) {
        const { dlc } = req.query
        InputValidator.validateField({ key: 'dlc', value: dlc }, 'string', true)
        if (!PackageManagerService.isDLCInstalled(dlc as string)) {
            throw new NotFound('DLC not found')
        }
        const items = CombatEditorService.getLoadedItems(dlc as string)
        res.status(200).json({ result: 'ok', items })
    }

    async getLoadedWeapons(req: Request, res: Response) {
        const { dlc } = req.query
        InputValidator.validateField({ key: 'dlc', value: dlc }, 'string', true)
        const weapons = CombatEditorService.getLoadedWeapons(dlc as string)
        res.status(200).json({ result: 'ok', weapons })
    }

    async getLoadedSpells(req: Request, res: Response) {
        const { dlc } = req.query
        InputValidator.validateField({ key: 'dlc', value: dlc }, 'string', true)
        const spells = CombatEditorService.getLoadedSpells(dlc as string)
        res.status(200).json({ result: 'ok', spells })
    }

    async getLoadedStatusEffects(req: Request, res: Response) {
        const { dlc } = req.query
        InputValidator.validateField({ key: 'dlc', value: dlc }, 'string', true)
        const status_effects = CombatEditorService.getLoadedStatusEffects(dlc as string)
        res.status(200).json({ result: 'ok', status_effects })
    }

    async createCombatPreset(req: Request, res: Response) {
        console.log('Creating combat preset. Params:', req.body)
        const { field } = req.body
        InputValidator.validateField({ key: 'field', value: field }, 'array', true)
        const preset_id = await CombatEditorService.createCombatPreset(field)
        res.status(200).json({ result: 'ok', preset_id })
    }
}

export default new CombatEditorController()
