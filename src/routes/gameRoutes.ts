import { Router } from 'express'
import CombatEditorController from '../controllers/CombatEditorController'

const router = Router()

// GET

router.get('/items/', CombatEditorController.getLoadedItems.bind(CombatEditorController))
router.get('/weapons/', CombatEditorController.getLoadedWeapons.bind(CombatEditorController))
router.get('/spells/', CombatEditorController.getLoadedSpells.bind(CombatEditorController))
router.get('/status_effects/', CombatEditorController.getLoadedStatusEffects.bind(CombatEditorController))
router.get('/characters/', CombatEditorController.getLoadedCharacters.bind(CombatEditorController))

// POST

router.post('/create_preset', CombatEditorController.createCombatPreset.bind(CombatEditorController))

export default router
