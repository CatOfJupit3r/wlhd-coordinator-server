import { Request, Response } from 'express'
import { MethodNotAllowed } from '../models/ErrorModels'
import EntityEditorService from '../services/EntityEditorService'
import InputValidator from '../services/InputValidator'

class EntityEditorController {
    async createEntity(req: Request, res: Response) {
        console.log('Creating entity. Params:', req.body)
        const { descriptor, attributes, customAttributes } = req.body
        InputValidator.validateObject(
            { descriptor, attributes, customAttributes },
            { descriptor: 'string', attributes: 'any', customAttributes: 'any' }
        )
        const entity_id = await EntityEditorService.createNewEntity(descriptor, attributes, customAttributes)
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

export default new EntityEditorController()
