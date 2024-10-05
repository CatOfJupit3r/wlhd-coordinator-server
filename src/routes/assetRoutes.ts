import AssetController from '@controllers/AssetController'
import { createConfig, createRouter } from '@controllers/RouteInController'

// GET

export default createRouter([
    createConfig('get', '/', AssetController.index),
    createConfig('get', '/:dlc', AssetController.getAvailableAssetsOnDLC),
    createConfig('get', '/:dlc/:asset', AssetController.getAsset),
])
