import { Router } from 'express'
import LobbyController from '../controllers/LobbyController'
import { authenticationMiddleware } from '../middleware/AuthenticationMiddleware'

const router = Router()

router.use(authenticationMiddleware)

// GET

router.get('/:lobby_id', LobbyController.getLobbyInfo.bind(LobbyController))
router.get('/:lobby_id/my_characters', LobbyController.getMyCharacterInfo.bind(LobbyController))
router.get('/:lobby_id/character/:character_id', LobbyController.getCharacterInfo.bind(LobbyController))
router.get('/:lobby_id/character/:character_id/weaponry', LobbyController.getCharacterWeaponry.bind(LobbyController))
router.get('/:lobby_id/character/:character_id/spellbook', LobbyController.getCharacterSpellbook.bind(LobbyController))
router.get(
    '/:lobby_id/character/:character_id/status_effects',
    LobbyController.getCharacterStatusEffects.bind(LobbyController)
)
router.get('/:lobby_id/character/:character_id/inventory', LobbyController.getCharacterInventory.bind(LobbyController))
router.get(
    '/:lobby_id/character/:character_id/attributes',
    LobbyController.getCharacterAttributes.bind(LobbyController)
)

// POST

router.post('/create', LobbyController.createNewLobby.bind(LobbyController))
router.post('/:lobby_id/create_combat', LobbyController.createCombatForLobby.bind(LobbyController))
router.post('/:lobby_id/character/add', LobbyController.createCharacter.bind(LobbyController))
router.post('/:lobby_id/character/:character_id/weaponry', LobbyController.addWeaponToCharacter.bind(LobbyController))
router.post('/:lobby_id/character/:character_id/spellbook', LobbyController.addSpellToCharacter.bind(LobbyController))
router.post(
    '/:lobby_id/character/:character_id/status_effects',
    LobbyController.addStatusEffectToCharacter.bind(LobbyController)
)
router.post('/:lobby_id/character/:character_id/inventory', LobbyController.addItemToCharacter.bind(LobbyController))
router.post(
    '/:lobby_id/character/:character_id/attributes',
    LobbyController.addAttributeToCharacter.bind(LobbyController)
)

// PATCH

router.patch('/:lobby_id/add_player', LobbyController.addPlayerToLobby.bind(LobbyController))
router.post('/:lobby_id/character/:character_id', LobbyController.updateCharacter.bind(LobbyController))
router.patch('/:lobby_id/character/:character_id/assign', LobbyController.assignCharacterToPlayer.bind(LobbyController))

export default router
