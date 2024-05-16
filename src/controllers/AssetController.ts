import { Request, Response } from 'express'
import AssetService from '../services/AssetService'
import InputValidator from '../services/InputValidator'

class AssetController {
    public index(req: Request, res: Response) {
        res.status(200).send({ dlcs: AssetService.getAllLoadedDLCs() })
    } // returns all NAMES of dlcs with assets

    public getAvailableAssetsOnDLC(req: Request, res: Response) {
        const { dlc } = req.params
        InputValidator.validateObject({ dlc }, { dlc: 'string' })
        res.status(200).send({ assets: AssetService.getDLCAssetNames(dlc) })
    } // returns all assets NAMES in individual dlc

    public getAsset(req: Request, res: Response) {
        const { dlc, asset } = req.params
        InputValidator.validateObject({ dlc, asset }, { dlc: 'string', asset: 'string' })

        const found_asset = AssetService.getAsset(dlc, asset)
        if (!asset) {
            return res.status(404).send({ message: 'Asset not found' })
        } else {
            return res.status(200).send(found_asset)
        }
    }
}

export default new AssetController()
