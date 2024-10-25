import { iUserAvatar } from '@models/InfoModels'
import crypto from 'crypto'

const generateAvatarString = (): string => {
    // return hashlib.sha256(os.urandom(length)).hexdigest()

    // Generate a random byte array of the given length
    const randomBytes = crypto.randomBytes(16)

    // Create a SHA-256 hash of the random bytes
    return crypto.createHash('sha256').update(randomBytes).digest('hex')
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
}
