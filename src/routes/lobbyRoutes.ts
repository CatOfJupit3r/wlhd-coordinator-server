import { Router } from 'express'
import LobbyController from '../controllers/LobbyController'
import { authenticationMiddleware } from '../middleware/AuthenticationMiddleware'

const router = Router()

router.use(authenticationMiddleware)

// GET

router.get('/:lobby_id/my_character', LobbyController.getMyCharacterInfo.bind(LobbyController))
router.get('/:lobby_id/character/:character_id', LobbyController.getCharacterInfo.bind(LobbyController))
router.get('/:lobby_id', LobbyController.getLobbyInfo.bind(LobbyController))

// POST

router.post('/create', LobbyController.createNewLobby.bind(LobbyController))
router.post('/:lobby_id/create_combat', LobbyController.createCombatForLobby.bind(LobbyController))

// PATCH

router.patch('/:lobby_id/add_player', LobbyController.addPlayerToLobby.bind(LobbyController))
router.patch('/:lobby_id/assign_character', LobbyController.assignCharacterToPlayer.bind(LobbyController))

export default router
