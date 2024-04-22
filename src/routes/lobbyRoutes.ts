import { Router } from 'express'
import LobbyController from '../controllers/LobbyController'
import { authenticationMiddleware } from '../middleware/AuthenticationMiddleware'

const router = Router()

// GET

router.get(
    '/:lobby_id/my_character',
    authenticationMiddleware,
    LobbyController.getMyCharacterInfo.bind(LobbyController)
)
router.get(
    '/:lobby_id/character/:character_id',
    authenticationMiddleware,
    LobbyController.getCharacterInfo.bind(LobbyController)
)
router.get('/:lobby_id', authenticationMiddleware, LobbyController.getLobbyInfo.bind(LobbyController))

// POST

router.post('/create', authenticationMiddleware, LobbyController.createNewLobby.bind(LobbyController))
router.post(
    '/:lobby_id/create_combat',
    authenticationMiddleware,
    LobbyController.createLobbyCombat.bind(LobbyController)
)

// PATCH

router.patch('/:lobby_id/add_player', authenticationMiddleware, LobbyController.addPlayerToLobby.bind(LobbyController))
router.patch(
    '/:lobby_id/assign_character',
    authenticationMiddleware,
    LobbyController.assignCharacterToPlayer.bind(LobbyController)
)

export default router
