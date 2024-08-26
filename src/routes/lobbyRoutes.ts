import { Router } from 'express'
import LobbyController from '../controllers/LobbyController'
import { authenticationMiddleware } from '../middleware/AuthenticationMiddleware'

const router = Router()

router.use(authenticationMiddleware)

// GET

router.get('/:lobby_id', LobbyController.getLobbyInfo.bind(LobbyController))
router.get('/:lobby_id/custom_translations', LobbyController.getCustomTranslations.bind(LobbyController))
router.get('/:lobby_id/my_characters', LobbyController.getMyCharacterInfo.bind(LobbyController))
router.get('/:lobby_id/characters/:descriptor', LobbyController.getCharacterInfo.bind(LobbyController))
router.get('/:lobby_id/characters/:descriptor/weaponry', LobbyController.getWeaponryOfCharacter.bind(LobbyController))
router.get('/:lobby_id/characters/:descriptor/spellbook', LobbyController.getSpellbookOfCharacter.bind(LobbyController))
router.get(
    '/:lobby_id/characters/:descriptor/status_effects',
    LobbyController.getStatusEffectsOfCharacter.bind(LobbyController)
)
router.get('/:lobby_id/characters/:descriptor/inventory', LobbyController.getInventoryOfCharacter.bind(LobbyController))
router.get(
    '/:lobby_id/characters/:descriptor/attributes',
    LobbyController.getAttributesOfCharacter.bind(LobbyController)
)

// POST

router.post('/', LobbyController.createNewLobby.bind(LobbyController))
router.post('/:lobby_id/combats', LobbyController.createCombatForLobby.bind(LobbyController))
router.post('/:lobby_id/characters', LobbyController.createCharacter.bind(LobbyController))
router.post('/:lobby_id/characters/:descriptor/weaponry', LobbyController.addWeaponToCharacter.bind(LobbyController))
router.post('/:lobby_id/characters/:descriptor/spellbook', LobbyController.addSpellToCharacter.bind(LobbyController))
router.post(
    '/:lobby_id/characters/:descriptor/status_effects',
    LobbyController.addStatusEffectToCharacter.bind(LobbyController)
)
router.post('/:lobby_id/characters/:descriptor/inventory', LobbyController.addItemToCharacter.bind(LobbyController))
router.post(
    '/:lobby_id/characters/:descriptor/attributes',
    LobbyController.addAttributeToCharacter.bind(LobbyController)
)

// PATCH

router.patch('/:lobby_id/players', LobbyController.addPlayerToLobby.bind(LobbyController))
router.patch('/:lobby_id/characters/:descriptor/players', LobbyController.assignCharacterToPlayer.bind(LobbyController))

// PUT

router.put('/:lobby_id/characters/:descriptor', LobbyController.updateCharacter.bind(LobbyController))

// DELETE

router.delete(
    '/:lobby_id/characters/:descriptor/players',
    LobbyController.removeCharacterFromPlayer.bind(LobbyController)
)
router.delete('/:lobby_id/characters/:descriptor', LobbyController.deleteCharacter.bind(LobbyController))

export default router
