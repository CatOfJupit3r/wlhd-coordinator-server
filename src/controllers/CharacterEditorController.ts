import { Request, Response } from 'express'
import { MethodNotAllowed } from '../models/ErrorModels'
import CharacterEditorService from '../services/CharacterEditorService'
import InputValidator from '../services/InputValidator'

class CharacterEditorController {
    async createEntity(req: Request, res: Response) {
        const { descriptor, decorations, attributes } = req.body
        InputValidator.validateObject(
            { descriptor, decorations, attributes },
            { descriptor: 'string', attributes: 'array', decorations: 'any' }
        )
        InputValidator.validateObject(decorations, { name: 'string', description: 'string', sprite: 'string' })
        for (const attribute of attributes) {
            InputValidator.validateObject(attribute, { dlc: 'string', descriptor: 'string', value: 'number' })
        }
        const entity_id = await CharacterEditorService.createNewEntity(descriptor, decorations, attributes)
        res.json({ result: 'ok', entity_id })
    }

    async changeAttribute(req: Request, res: Response) {
        throw new MethodNotAllowed()
    }

    async addWeapon(req: Request, res: Response) {
        throw new MethodNotAllowed()
    }

    async addSpell(req: Request, res: Response) {
        throw new MethodNotAllowed()
    }

    async addItem(req: Request, res: Response) {
        throw new MethodNotAllowed()
    }

    async removeWeapon(req: Request, res: Response) {
        throw new MethodNotAllowed()
    }

    async removeSpell(req: Request, res: Response) {
        throw new MethodNotAllowed()
    }

    async removeItem(req: Request, res: Response) {
        throw new MethodNotAllowed()
    }

    async getEntityInfo(req: Request, res: Response) {
        throw new MethodNotAllowed()
    }
}

export default new CharacterEditorController()
