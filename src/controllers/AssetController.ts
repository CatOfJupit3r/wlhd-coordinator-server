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

            const found_asset = AssetService.getAssetPath(dlc, asset)
            if (!found_asset) {
                res.status(404).send({ message: 'Asset not found' })
            } else {
                const { path } = found_asset
                res.status(200).header('Cache-Control', 'no-cache').sendFile(path)
            }
        },
        {
            params: z.object({ dlc: z.string().regex(DLC_TAG_REGEX()), asset: z.string() }),
        }
    )
}

export default new AssetController()
