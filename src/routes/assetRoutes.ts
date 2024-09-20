import AssetController from '@controllers/AssetController'
import { Router } from 'express'

const route = Router()

// GET

route.get('/', AssetController.index.bind(AssetController))
route.get('/:dlc', AssetController.getAvailableAssetsOnDLC.bind(AssetController))
route.get('/:dlc/:asset', AssetController.getAsset.bind(AssetController))

export default route
