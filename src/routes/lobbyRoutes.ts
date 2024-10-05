import LobbyController from '@controllers/LobbyController'
import { createConfig, createRouter } from '@controllers/RouteInController'
import { authenticationMiddleware } from '@middlewares/AuthenticationMiddleware'

export default createRouter(
    [
        // GET
        createConfig('get', '/:lobby_id', LobbyController.getLobbyInfo),
        createConfig('get', '/:lobby_id/custom_translations', LobbyController.getCustomTranslations),
        createConfig('get', '/:lobby_id/my_characters', LobbyController.getMyCharacterInfo),
        createConfig('get', '/:lobby_id/characters/:descriptor', LobbyController.getCharacterInfo),
        createConfig('get', '/:lobby_id/characters/:descriptor/weaponry', LobbyController.getWeaponryOfCharacter),
        createConfig('get', '/:lobby_id/characters/:descriptor/spellbook', LobbyController.getSpellbookOfCharacter),
        createConfig(
            'get',
            '/:lobby_id/characters/:descriptor/status_effects',
            LobbyController.getStatusEffectsOfCharacter
        ),
        createConfig('get', '/:lobby_id/characters/:descriptor/inventory', LobbyController.getInventoryOfCharacter),
        createConfig('get', '/:lobby_id/characters/:descriptor/attributes', LobbyController.getAttributesOfCharacter),
        // POST
        createConfig('post', '/', LobbyController.createNewLobby),
        createConfig('post', '/:lobby_id/combats', LobbyController.createCombatForLobby),
        createConfig('post', '/:lobby_id/characters', LobbyController.createCharacter),
        createConfig('post', '/:lobby_id/characters/:descriptor/weaponry', LobbyController.addWeaponToCharacter),
        createConfig('post', '/:lobby_id/characters/:descriptor/spellbook', LobbyController.addSpellToCharacter),
        createConfig(
            'post',
            '/:lobby_id/characters/:descriptor/status_effects',
            LobbyController.addStatusEffectToCharacter
        ),
        createConfig('post', '/:lobby_id/characters/:descriptor/inventory', LobbyController.addItemToCharacter),
        createConfig('post', '/:lobby_id/characters/:descriptor/attributes', LobbyController.addAttributeToCharacter),
        // PATCH
        createConfig('patch', '/:lobby_id/players', LobbyController.addPlayerToLobby),
        createConfig('patch', '/:lobby_id/characters/:descriptor/players', LobbyController.assignCharacterToPlayer),
        // PUT
        createConfig('put', '/:lobby_id/characters/:descriptor', LobbyController.updateCharacter),
        // DELETE
        createConfig('delete', '/:lobby_id/characters/:descriptor/players', LobbyController.removeCharacterFromPlayer),
        createConfig('delete', '/:lobby_id/characters/:descriptor', LobbyController.deleteCharacter),
    ],
    [authenticationMiddleware]
)
