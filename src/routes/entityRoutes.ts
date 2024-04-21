import { Router } from 'express'
import EntityEditorController from '../controllers/EntityEditorController'
import { authenticationMiddleware } from '../middleware/AuthenticationMiddleware'

const router = Router()

router.post('/create', authenticationMiddleware, EntityEditorController.createEntity.bind(EntityEditorController))

export default router
