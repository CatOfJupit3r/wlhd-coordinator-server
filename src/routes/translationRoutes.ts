import { createConfig, createRouter } from '@controllers/RouteInController'
import TranslationController from '@controllers/TranslationController'

export default createRouter([
    createConfig('get', '/', TranslationController.getTranslation),
    createConfig('get', '/snippet', TranslationController.getTranslationSnippet),
    createConfig('post', '/reload', TranslationController.reloadTranslationsReq),
])
