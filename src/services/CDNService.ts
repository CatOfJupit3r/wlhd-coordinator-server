import { iUserAvatar } from '@models/InfoModels'
import { RandomUtils } from '@utils'
import fs from 'fs'
import UserAvatarGenerator from '../utils/UserAvatarGenerator'

const CDN_PATH = 'src/cdn'

class CDNService {
    /*
    
    This is a pseudo cdn.
    I don't really want to get into s3 buckets, cdns and such,
    so I decided to keep em all in src/cdn folder
    
     */

    async createAvatar(avatar: iUserAvatar): Promise<Buffer> {
        // create base64 png image from avatar object
        const { pattern, mainColor, secondaryColor } = avatar.generated
        const canvas = UserAvatarGenerator.generateImage(pattern, mainColor, secondaryColor)
        return canvas.toBuffer('image/png')
    }

    async saveAvatar(avatar: iUserAvatar, buffer: Buffer): Promise<void> {
        // save base64 png image to file
        const avatarCypher = RandomUtils.hashAvatar(avatar)
        const avatarPath = `${CDN_PATH}/avatars/${avatarCypher}.png`

        try {
            fs.writeFileSync(avatarPath, buffer)
        } catch (err) {
            console.log("Couldn't save avatar", err)
        }
    }

    async getAvatarBuffer(avatar: iUserAvatar): Promise<Buffer> {
        // get base64 png image from avatar object
        const avatarCypher = RandomUtils.hashAvatar(avatar)
        const avatarPath = `${CDN_PATH}/avatars/${avatarCypher}.png`

        // check if the file exists
        // if not, create it

        try {
            // Attempt to read the file synchronously
            return fs.readFileSync(avatarPath)
        } catch (err) {
            // If file does not exist, create a new avatar and save it
            const createdAvatar = await this.createAvatar(avatar)
            await this.saveAvatar(avatar, createdAvatar)
            return createdAvatar
        }
    }

    async getAvatarFile(avatar: iUserAvatar): Promise<string> {
        const buffer = await this.getAvatarBuffer(avatar)
        return buffer.toString('base64')
    }
}

export default new CDNService()
