import { iUserAvatar } from '@models/InfoModels'
import crypto from 'crypto'

const generateRandomString = (length: number): string => {
    const randomBytes = crypto.randomBytes(length)
    return crypto.createHash('sha256').update(randomBytes).digest('hex')
}

const generateAvatarString = (): string => {
    return generateRandomString(16)
}

const createTwoRandomColors = (): [string, string] => {
    const randomColor = () =>
        Math.floor(Math.random() * 16777215)
            .toString(16)
            .toUpperCase()
    return [`#${randomColor()}`, `#${randomColor()}`]
}

function hashAvatar(avatar: iUserAvatar): string {
    // Serialize only the "generated" properties to keep it consistent
    const dataToHash = JSON.stringify({
        pattern: avatar.generated.pattern,
        mainColor: avatar.generated.mainColor,
        secondaryColor: avatar.generated.secondaryColor,
    })

    // Generate an MD5 hash of the serialized data
    return crypto.createHash('md5').update(dataToHash).digest('hex')
}

export default {
    generateAvatarString,
    hashAvatar,
    createTwoRandomColors,
    generateRandomString,
}
