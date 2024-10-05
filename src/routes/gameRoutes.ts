import CombatEditorController from '@controllers/CombatEditorController'
import { createConfig, createRouter } from '@controllers/RouteInController'

export default createRouter([
    // GET
    createConfig('get', '/items/', CombatEditorController.getLoadedItems),
    createConfig('get', '/weapons/', CombatEditorController.getLoadedWeapons),
    createConfig('get', '/spells/', CombatEditorController.getLoadedSpells),
    createConfig('get', '/status_effects/', CombatEditorController.getLoadedStatusEffects),
    createConfig('get', '/characters/', CombatEditorController.getLoadedCharacters),

    // POST
    createConfig('post', '/preset', CombatEditorController.createCombatPreset),
])
