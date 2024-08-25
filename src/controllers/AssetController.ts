import { Request, Response } from 'express'
import { BadRequest } from '../models/ErrorModels'
import AssetService from '../services/AssetService'

class AssetController {
    public index(req: Request, res: Response) {
        res.status(200).send({ dlcs: AssetService.getAllLoadedDLCs() })
    } // returns all NAMES of dlcs with assets

    public getAvailableAssetsOnDLC(req: Request, res: Response) {
        const { dlc } = req.params
        if (!dlc) {
            throw new BadRequest('DLC name is required')
        }
        res.status(200).send({ assets: AssetService.getDLCAssetNames(dlc) })
    } // returns all assets NAMES in individual dlc

    public getAsset(req: Request, res: Response) {
        const { dlc, asset } = req.params
        if (!dlc) {
            throw new BadRequest('DLC name is required')
        } else if (!asset) {
            throw new BadRequest('Asset name is required')
        }

        const found_asset = AssetService.getAsset(dlc, asset)
        if (!asset) {
            return res.status(404).send({ message: 'Asset not found' })
        } else {
            return res.status(200).send(found_asset)
        }
    }

    public reloadAssets() {
        AssetService.reloadAssets()
    }
}

export default new AssetController()
