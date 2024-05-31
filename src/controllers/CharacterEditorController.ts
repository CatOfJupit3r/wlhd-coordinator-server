import { Request, Response } from 'express'
import { MethodNotAllowed } from '../models/ErrorModels'

class CharacterEditorController {
    async createEntity(req: Request, res: Response) {
        throw new MethodNotAllowed()
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
