import { Router } from 'express'
import EntityEditorController from '../controllers/EntityEditorController'
import { authenticationMiddleware } from '../middleware/AuthenticationMiddleware'

const router = Router()
router.use(authenticationMiddleware)

// GET

router.get('/:entity_id/', EntityEditorController.getEntityInfo.bind(EntityEditorController))

// POST

router.post('/create', EntityEditorController.createEntity.bind(EntityEditorController))
router.post('/:entity_id/weapon', EntityEditorController.addWeapon.bind(EntityEditorController))
router.post('/:entity_id/spell', EntityEditorController.addSpell.bind(EntityEditorController))
router.post('/:entity_id/item', EntityEditorController.addItem.bind(EntityEditorController))

// PATCH

router.patch('/:entity_id/attribute', EntityEditorController.changeAttribute.bind(EntityEditorController))

// DELETE

router.delete('/:entity_id/weapon', EntityEditorController.removeWeapon.bind(EntityEditorController))
router.delete('/:entity_id/spell', EntityEditorController.removeSpell.bind(EntityEditorController))
router.delete('/:entity_id/item', EntityEditorController.removeItem.bind(EntityEditorController))

export default router
