import { Router } from 'express'
import CombatEditorController from '../controllers/CombatEditorController'

const router = Router()

router.post('/create_preset', CombatEditorController.createCombatPreset.bind(CombatEditorController))

export default router
