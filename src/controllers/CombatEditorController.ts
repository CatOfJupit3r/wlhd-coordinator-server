import { Request, Response } from 'express'
import CombatEditorService from '../services/GameServerService'
import InputValidator from '../services/InputValidator'

class CombatEditorController {
    async createCombatPreset(req: Request, res: Response) {
        console.log('Creating combat preset. Params:', req.body)
        const { field } = req.body
        InputValidator.validateField({ key: 'field', value: field }, 'array', true)
        const preset_id = await CombatEditorService.createCombatPreset(field)
        res.status(200).json({ result: 'ok', preset_id })
    }
}

export default new CombatEditorController()
