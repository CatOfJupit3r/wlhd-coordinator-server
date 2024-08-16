import { Request, Response } from 'express'
import { BadRequest } from '../models/ErrorModels'
import InputValidator from '../services/InputValidator'
import TranslationService from '../services/TranslationService'
import { TranslationCache } from '../utils/TranslationCache'

export class TranslationController {
    private cache: TranslationCache

    constructor() {
        this.cache = new TranslationCache()
    }

    public reloadTranslationsReq(req: Request, res: Response): void {
        this.reloadTranslations()
        res.status(200).json({ message: 'Translations reloaded' })
    }

    public reloadTranslations(): void {
        this.cache.clear()
        TranslationService.reloadTranslations()
    }

    public getTranslation(req: Request, res: Response): void {
        const query = req.query

        const language = typeof query.language === 'string' ? query.language : ''
        const dlc = typeof query.dlc === 'string' ? query.dlc : ''
        const strict = typeof query.strict === 'string' ? query.strict : 'false'

        InputValidator.validateObject({ language, dlc }, { language: 'string', dlc: 'string' }, true)
        if (!language || !dlc) throw new BadRequest('Missing: language or dlc') // for eslint
        const languages = language.toString().split(',')
        const dlcs = dlc.toString().split(',')
        const strictMode = strict === 'true'
        res.status(200).json(TranslationService.getLanguage(languages, dlcs, strictMode))
    }

    public getTranslationSnippet(req: Request, res: Response): void {
        const query = req.query

        const language = typeof query.language === 'string' ? query.language : ''
        const dlc = typeof query.dlc === 'string' ? query.dlc : ''
        const keys = typeof query.keys === 'string' ? query.keys : ''
        const strict = typeof query.strict === 'string' ? query.strict : 'false'

        InputValidator.validateObject(
            { language, dlc, keys },
            { language: 'string', dlc: 'string', keys: 'string' },
            true
        )
        if (!language || !dlc || !keys) throw new BadRequest('Missing: language or dlc') // for eslint
        if (keys.toString().split(',').length === 0) throw new BadRequest('Missing: keys')
        const languages = language.toString().split(',')
        const dlcs = dlc.toString().split(',')
        const strictMode = strict === 'true'
        res.status(200).json(
            TranslationService.getTranslationSnippet(languages, dlcs, keys.toString().split(','), strictMode)
        )
    }
}

export default new TranslationController()
