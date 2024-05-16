import { Router } from 'express'
import AssetController from '../controllers/AssetController'

const route = Router()

// GET

route.get('/', AssetController.index.bind(AssetController))
route.get('/:dlc', AssetController.getAvailableAssetsOnDLC.bind(AssetController))
route.get('/:dlc/:asset', AssetController.getAsset.bind(AssetController))

export default route
