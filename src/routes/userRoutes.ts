import { Router } from 'express'
import UserController from '../controllers/UserController'
import { authenticationMiddleware } from '../middleware/AuthenticationMiddleware'

const router = Router()

router.get('/profile', authenticationMiddleware, UserController.getProfile.bind(UserController))
router.get('/joined_lobbies', authenticationMiddleware, UserController.getJoinedLobbies.bind(UserController))

export default router
