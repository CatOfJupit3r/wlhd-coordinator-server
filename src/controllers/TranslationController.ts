import { Request, Response } from 'express'
import { BadRequest } from '../models/ErrorModels'
import InputValidator from '../services/InputValidator'
import TranslationService from '../services/TranslationService'
import { Cache } from '../utils/Cache'

export class TranslationController {
    private cache: Cache

    constructor() {
        this.cache = new Cache()
    }

    public reloadTranslations(req: Request, res: Response): void {
        TranslationService.reloadTranslations()
        this.cache.clear()
        res.status(200).json({ message: 'Translations reloaded' })
    }

    public getTranslation(req: Request, res: Response): void {
        const { language, dlc } = req.query
        InputValidator.validateObject({ language, dlc }, { language: 'string', dlc: 'string' }, true)
        if (!language || !dlc) throw new BadRequest('Missing: language or dlc') // for eslint
        if (this.cache.get(`${language}-${dlc}`)) {
            res.json(this.cache.get(`${language}-${dlc}`))
            return
        }
        const translation = TranslationService.getTranslation(language.toString(), dlc.toString())
        if (translation) this.cache.set(`${language}-${dlc}`, translation)
        res.json(translation)
    }

    public getTranslationSnippet(req: Request, res: Response): void {
        const { language, dlc, keys } = req.query
        InputValidator.validateObject(
            { language, dlc, keys },
            { language: 'string', dlc: 'string', keys: 'string' },
            true
        )
        if (!language || !dlc || !keys) throw new BadRequest('Missing: language or dlc') // for eslint
        if (keys.toString().split(',').length === 0) throw new BadRequest('Missing: keys')
        if (this.cache.get(`${language}-${dlc}-${keys}`)) {
            res.json(this.cache.get(`${language}-${dlc}-${keys}`))
            return
        }
        const translation = TranslationService.getTranslationSnippet(
            language.toString(),
            dlc.toString(),
            keys.toString().split(',')
        )
        this.cache.set(`${language}-${dlc}-${keys}`, translation)
        res.json(translation)
    }
}
