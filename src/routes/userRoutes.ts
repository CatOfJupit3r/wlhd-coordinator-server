import UserController from '@controllers/UserController'
import { authenticationMiddleware } from '@middlewares/AuthenticationMiddleware'
import { Router } from 'express'

const router = Router()

router.get('/profile', authenticationMiddleware, UserController.getProfile.bind(UserController))
router.get('/joined', authenticationMiddleware, UserController.getJoinedLobbies.bind(UserController))

export default router
