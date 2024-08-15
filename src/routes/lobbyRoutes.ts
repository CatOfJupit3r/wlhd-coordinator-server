import { Router } from 'express'
import LobbyController from '../controllers/LobbyController'
import { authenticationMiddleware } from '../middleware/AuthenticationMiddleware'

const router = Router()

router.use(authenticationMiddleware)

// GET

router.get('/:lobby_id', LobbyController.getLobbyInfo.bind(LobbyController))
router.get('/:lobby_id/custom_translations', LobbyController.getCustomTranslations.bind(LobbyController))
router.get('/:lobby_id/my_characters', LobbyController.getMyCharacterInfo.bind(LobbyController))
router.get('/:lobby_id/character/:descriptor', LobbyController.getCharacterInfo.bind(LobbyController))
router.get('/:lobby_id/character/:descriptor/weaponry', LobbyController.getWeaponryOfCharacter.bind(LobbyController))
router.get('/:lobby_id/character/:descriptor/spellbook', LobbyController.getSpellbookOfCharacter.bind(LobbyController))
router.get(
    '/:lobby_id/character/:descriptor/status_effects',
    LobbyController.getStatusEffectsOfCharacter.bind(LobbyController)
)
router.get('/:lobby_id/character/:descriptor/inventory', LobbyController.getInventoryOfCharacter.bind(LobbyController))
router.get(
    '/:lobby_id/character/:descriptor/attributes',
    LobbyController.getAttributesOfCharacter.bind(LobbyController)
)

// POST

router.post('/create', LobbyController.createNewLobby.bind(LobbyController))
router.post('/:lobby_id/create_combat', LobbyController.createCombatForLobby.bind(LobbyController))
router.post('/:lobby_id/character/new', LobbyController.createCharacter.bind(LobbyController))
router.post('/:lobby_id/character/:descriptor/weaponry', LobbyController.addWeaponToCharacter.bind(LobbyController))
router.post('/:lobby_id/character/:descriptor/spellbook', LobbyController.addSpellToCharacter.bind(LobbyController))
router.post(
    '/:lobby_id/character/:descriptor/status_effects',
    LobbyController.addStatusEffectToCharacter.bind(LobbyController)
)
router.post('/:lobby_id/character/:descriptor/inventory', LobbyController.addItemToCharacter.bind(LobbyController))
router.post(
    '/:lobby_id/character/:descriptor/attributes',
    LobbyController.addAttributeToCharacter.bind(LobbyController)
)

// PATCH

router.patch('/:lobby_id/add_player', LobbyController.addPlayerToLobby.bind(LobbyController))
router.patch('/:lobby_id/character/:descriptor', LobbyController.updateCharacter.bind(LobbyController))
router.patch(
    '/:lobby_id/character/:descriptor/assign_player',
    LobbyController.assignCharacterToPlayer.bind(LobbyController)
)
router.patch(
    '/:lobby_id/character/:descriptor/spell_layout',
    LobbyController.changeSpellLayoutOfCharacter.bind(LobbyController)
)

// DELETE

router.delete(
    '/:lobby_id/character/:descriptor/remove_player',
    LobbyController.removeCharacterFromPlayer.bind(LobbyController)
)
router.delete('/:lobby_id/character/:descriptor', LobbyController.deleteCharacter.bind(LobbyController))

export default router
