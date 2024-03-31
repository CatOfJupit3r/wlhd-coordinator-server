import jwt, { TokenExpiredError } from 'jsonwebtoken'
import { Types } from 'mongoose'
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } from '../configs/config'

class AuthService {
    refreshTokens: Array<string> = []

    isTokenExpiredError = (error: Error) => error instanceof TokenExpiredError

    generateAccessToken(user: { _id: Types.ObjectId; handle: string }) {
        const payload = { _id: user._id, handle: user.handle }
        return jwt.sign(payload, JWT_ACCESS_SECRET, {
            expiresIn: '60m',
        })
    }

    generateRefreshToken(user: { _id: Types.ObjectId; handle: string }) {
        const payload = { _id: user._id, handle: user.handle }
        const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
            expiresIn: '365d',
        })
        this.refreshTokens.push(refreshToken)

        return refreshToken
    }

    issueNewAccessToken(refreshToken: string) {
        const decodedUser = this.verifyRefreshToken(refreshToken)
        return this.generateAccessToken({ _id: new Types.ObjectId(decodedUser._id), handle: decodedUser.handle })
    }

    verifyAccessToken(accessToken: string) {
        return jwt.verify(accessToken, JWT_ACCESS_SECRET) as { _id: string; handle: string }
    }

    verifyRefreshToken(refreshToken: string): { _id: string; handle: string } {
        // TODO: NON-PRODUCTION CODE

        if (!this.refreshTokens.includes(refreshToken)) {
            throw new Error('Refresh token is not valid')
        }
        return jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { _id: string; handle: string }
    }

    invalidateRefreshToken(refreshToken: string) {
        this.refreshTokens = this.refreshTokens.filter((t) => t !== refreshToken)
    }
}

export default new AuthService()
