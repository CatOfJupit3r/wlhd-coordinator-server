import fs from 'fs'
import { PATH_TO_INSTALLED_PACKAGES } from '../configs'

interface AssetInfo {
    [asset_name: string]: Array<string>
}

class AssetService {
    private fileFormatPriority = ['svg', 'png', 'gif', 'webp', 'jpg', 'jpeg']
    private loadedAssets: {
        [dlc: string]: AssetInfo
    } = {}

    constructor() {
        this.reloadAssets()
    }

    public getAllLoadedDLCs() {
        return fs.readdirSync(PATH_TO_INSTALLED_PACKAGES).filter((value) => value !== '.DS_Store') || []
    }

    public getDLCAssetNames(dlc: string): Array<string> {
        return Object.keys(this.loadedAssets[dlc] || {}) || []
    }

    public getAsset(dlc: string, asset: string) {
        const available_assets = this.getAssetsInfo(dlc)
        const assetFormats = available_assets[asset]
        if (!assetFormats) {
            return null
        }
        for (const format of assetFormats) {
            try {
                return fs.readFileSync(`${PATH_TO_INSTALLED_PACKAGES}/${dlc}/assets/${asset}.${format}`)
            } catch (err) {
                continue
            }
        }
        return null
    }

    private getAssetsInfo(dlc: string): AssetInfo {
        const assetsInfo: AssetInfo = {}
        const rawAssets = fs.readdirSync(`${PATH_TO_INSTALLED_PACKAGES}/${dlc}/assets`)
        for (const asset of rawAssets) {
            const assetName = asset.split('.')[0]
            const assetFormat = asset.split('.')[1]
            if (assetsInfo[assetName]) {
                assetsInfo[assetName].push(assetFormat)
            } else {
                assetsInfo[assetName] = [assetFormat]
            }
            assetsInfo[assetName].sort((a, b) => {
                if (!this.fileFormatPriority.indexOf(a)) {
                    return -1
                } else if (!this.fileFormatPriority.indexOf(b)) {
                    return 1
                } else {
                    return this.fileFormatPriority.indexOf(a) - this.fileFormatPriority.indexOf(b)
                }
            })
        }
        return assetsInfo
    }

    public reloadAssets() {
        const dlcs = this.getAllLoadedDLCs()
        for (const dlc of dlcs) {
            this.loadedAssets[dlc] = this.getAssetsInfo(dlc)
        }
    }
}

export default new AssetService()
