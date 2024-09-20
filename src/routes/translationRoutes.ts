import TranslationController from '@controllers/TranslationController'
import { Router } from 'express'

const router = Router()

// GET

router.get('/', TranslationController.getTranslation.bind(TranslationController))
router.get('/snippet', TranslationController.getTranslationSnippet.bind(TranslationController))

// POST

router.post('/reload', TranslationController.reloadTranslationsReq.bind(TranslationController))

export default router
