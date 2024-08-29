import { Request, Response } from 'express'
import { BadRequest, NotFound } from '../models/ErrorModels'
import { CombatEditorSchema } from '../schemas/CombatEditorSchemas'
import CombatEditorService from '../services/GameServerService'
import PackageManagerService from '../services/PackageManagerService'

class CombatEditorController {
    async getLoadedItems(req: Request, res: Response) {
        const { dlc } = req.query
        if (!dlc) {
            throw new NotFound('DLC name is required')
        }
        if (!PackageManagerService.isDLCInstalled(dlc as string)) {
            throw new NotFound('DLC not found')
        }
        const items = CombatEditorService.getLoadedItems(dlc as string)
        res.status(200).json({ result: 'ok', items })
    }

    async getLoadedWeapons(req: Request, res: Response) {
        const { dlc } = req.query
        if (!dlc) {
            throw new NotFound('DLC name is required')
        }
        const weapons = CombatEditorService.getLoadedWeapons(dlc as string)
        res.status(200).json({ result: 'ok', weapons })
    }

    async getLoadedSpells(req: Request, res: Response) {
        const { dlc } = req.query
        if (!dlc) {
            throw new NotFound('DLC name is required')
        }
        const spells = CombatEditorService.getLoadedSpells(dlc as string)
        res.status(200).json({ result: 'ok', spells })
    }

    async getLoadedStatusEffects(req: Request, res: Response) {
        const { dlc } = req.query
        if (!dlc) {
            throw new NotFound('DLC name is required')
        }
        const status_effects = CombatEditorService.getLoadedStatusEffects(dlc as string)
        res.status(200).json({ result: 'ok', status_effects })
    }

    async getLoadedCharacters(req: Request, res: Response) {
        const { dlc } = req.query
        if (!dlc) {
            throw new NotFound('DLC name is required')
        }
        const characters = CombatEditorService.getLoadedCharacters(dlc as string)
        res.status(200).json({ result: 'ok', characters })
    }

    async createCombatPreset(req: Request, res: Response) {
        const validation = CombatEditorSchema.safeParse(req.body)
        if (!validation.success) {
            throw new BadRequest(validation.error.message, {
                ...validation.error,
            })
        }
        const { nickName, battlefield } = validation.data
        res.status(200).json({ result: 'ok', preset_id: '111' })
    }
}

export default new CombatEditorController()
