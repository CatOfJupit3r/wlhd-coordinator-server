import { Request, Response } from 'express'
import { BadRequest } from '../models/ErrorModels'
import CombatEditorService from '../services/CombatEditorService'

class CombatEditorController {
    async createCombatPreset(req: Request, res: Response) {
        console.log('Creating combat preset. Params:', req.body)
        const { field } = req.body
        if (!field) throw new BadRequest('Missing parameters: field')
        const preset_id = await CombatEditorService.createCombatPreset(field)
        res.json({ result: 'ok', preset_id })
    }
}

export default new CombatEditorController()
