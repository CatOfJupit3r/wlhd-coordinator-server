import { createRouteInController } from '@controllers/RouteInController'
import TranslationService from '@services/TranslationService'
import { TranslationCache } from '@utils'
import { Request, Response } from 'express'
import { z } from 'zod'

const languageAndDlcQuery = z.object({
    language: z.string().optional(),
    dlc: z.string().optional(),
    strict: z.string().optional(),
})

const getTranslationQuery = z
    .object({})
    .merge(languageAndDlcQuery)
    .refine((query) => query.language || query.dlc, { message: 'Missing: language or dlc' })

const translationSnippetQuery = z
    .object({
        keys: z.string(),
    })
    .merge(languageAndDlcQuery)
    .refine(
        (query) => {
            return query.keys && query.keys.toString().split(',').length !== 0
        },
        { message: 'Missing: keys' }
    )

export class TranslationController {
    private cache: TranslationCache

    constructor() {
        this.cache = new TranslationCache()
    }

    reloadTranslationsReq = createRouteInController((req: Request, res: Response) => {
        this.reloadTranslations()
        res.status(200).json({ message: 'Translations reloaded' })
    }, {})

    public reloadTranslations(): void {
        this.cache.clear()
        TranslationService.reloadTranslations()
    }

    getTranslation = createRouteInController(
        (req: Request, res: Response) => {
            const query = req.query

            const language = typeof query.language === 'string' ? query.language : ''
            const dlc = typeof query.dlc === 'string' ? query.dlc : ''
            const strict = typeof query.strict === 'string' ? query.strict : 'false'

            const languages = language.toString().split(',')
            const dlcs = dlc.toString().split(',')
            const strictMode = strict === 'true'
            res.status(200).json(TranslationService.getLanguage(languages, dlcs, strictMode))
        },
        {
            query: getTranslationQuery,
        }
    )

    getTranslationSnippet = createRouteInController(
        (req: Request, res: Response) => {
            const query = req.query

            const language = typeof query.language === 'string' ? query.language : ''
            const dlc = typeof query.dlc === 'string' ? query.dlc : ''
            const keys = typeof query.keys === 'string' ? query.keys : ''
            const strict = typeof query.strict === 'string' ? query.strict : 'false'

            const languages = language.toString().split(',')
            const dlcs = dlc.toString().split(',')
            const strictMode = strict === 'true'
            res.status(200).json(
                TranslationService.getTranslationSnippet(languages, dlcs, keys.toString().split(','), strictMode)
            )
        },
        {
            query: translationSnippetQuery,
        }
    )
}

export default new TranslationController()
