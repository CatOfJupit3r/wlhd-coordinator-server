import { Router } from 'express'
import { TranslationController } from '../controllers/TranslationController'

const router = Router()
const translationController = new TranslationController()

// GET

router.get('/', translationController.getTranslation.bind(translationController))
router.get('/snippet', translationController.getTranslationSnippet.bind(translationController))

// POST

router.post('/reload', translationController.reloadTranslations.bind(translationController))

export default router
