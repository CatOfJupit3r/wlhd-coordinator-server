import { Request, Response } from 'express'
import { BadRequest } from '../models/ErrorModels'
import EntityEditorService from '../services/EntityEditorService'

class EntityEditorController {
    async createEntity(req: Request, res: Response) {
        console.log('Creating entity. Params:', req.body)
        const { descriptor, attributes, customAttributes } = req.body
        if (!descriptor || !attributes || !customAttributes) {
            throw new BadRequest(
                `Missing parameters: ${!descriptor ? 'descriptor' : ''} ${!attributes ? 'attributes' : ''} ${!customAttributes ? 'customAttributes' : ''}`
            )
        }
        const entity_id = await EntityEditorService.createNewEntity(descriptor, attributes, customAttributes)
        res.json({ result: 'ok', entity_id })
    }
}

export default new EntityEditorController()
