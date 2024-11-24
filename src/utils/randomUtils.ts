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

export default {
    generateAvatarString,
    createTwoRandomColors,
    generateRandomString,
}
