import { Router } from 'express'
import CharacterEditorController from '../controllers/CharacterEditorController'
import { authenticationMiddleware } from '../middleware/AuthenticationMiddleware'

const router = Router()
router.use(authenticationMiddleware)

// GET

router.get('/:character_id/', CharacterEditorController.getEntityInfo.bind(CharacterEditorController))

// POST

router.post('/create', CharacterEditorController.createEntity.bind(CharacterEditorController))
router.post('/:character_id/weapon', CharacterEditorController.addWeapon.bind(CharacterEditorController))
router.post('/:character_id/spell', CharacterEditorController.addSpell.bind(CharacterEditorController))
router.post('/:character_id/item', CharacterEditorController.addItem.bind(CharacterEditorController))

// PATCH

router.patch('/:character_id/attribute', CharacterEditorController.changeAttribute.bind(CharacterEditorController))

// DELETE

router.delete('/:character_id/weapon', CharacterEditorController.removeWeapon.bind(CharacterEditorController))
router.delete('/:character_id/spell', CharacterEditorController.removeSpell.bind(CharacterEditorController))
router.delete('/:character_id/item', CharacterEditorController.removeItem.bind(CharacterEditorController))

export default router
