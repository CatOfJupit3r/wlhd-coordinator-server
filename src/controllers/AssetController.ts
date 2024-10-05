import { DLC_TAG_REGEX } from '@config/regex'
import { createRouteInController } from '@controllers/RouteInController'
import AssetService from '@services/AssetService'
import { Request, Response } from 'express'
import { z } from 'zod'

class AssetController {
    index = createRouteInController(async (req: Request, res: Response) => {
        res.status(200).send({ dlcs: AssetService.getAllLoadedDLCs() })
    })

    getAvailableAssetsOnDLC = createRouteInController(
        async (req: Request, res: Response) => {
            const { dlc } = req.params
            res.status(200).send({ assets: AssetService.getDLCAssetNames(dlc) })
        },
        {
            params: z.object({ dlc: z.string().regex(DLC_TAG_REGEX()) }),
        }
    )

    getAsset = createRouteInController(
        async (req: Request, res: Response) => {
            const { dlc, asset } = req.params

            const found_asset = AssetService.getAsset(dlc, asset)
            if (!asset) {
                res.status(404).send({ message: 'Asset not found' })
            } else {
                res.status(200).send(found_asset)
            }
        },
        {
            params: z.object({ dlc: z.string().regex(DLC_TAG_REGEX()), asset: z.string() }),
        }
    )
}

export default new AssetController()
