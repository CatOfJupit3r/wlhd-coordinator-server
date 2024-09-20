import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET } from '@configs'
import { BadRequest } from '@models/ErrorModels'
import jwt from 'jsonwebtoken'
import { Types } from 'mongoose'

class AuthService {
    refreshTokens: Array<string> = []

    generateAccessToken(user: { _id: Types.ObjectId; handle: string }) {
        const payload = { _id: user._id, handle: user.handle }
        return jwt.sign(payload, JWT_ACCESS_SECRET(), {
            expiresIn: '7d',
        })
    }

    generateRefreshToken(user: { _id: Types.ObjectId; handle: string }) {
        const payload = { _id: user._id, handle: user.handle }
        const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET(), {
            expiresIn: '7d',
        })
        this.refreshTokens.push(refreshToken)

        return refreshToken
    }

    issueNewAccessToken(refreshToken: string) {
        const decodedUser = this.verifyRefreshToken(refreshToken)
        return this.generateAccessToken({ _id: new Types.ObjectId(decodedUser._id), handle: decodedUser.handle })
    }

    verifyAccessToken(accessToken: string) {
        if (!accessToken) {
            throw new BadRequest('Access token is missing')
        }
        return jwt.verify(accessToken, JWT_ACCESS_SECRET()) as { _id: string; handle: string }
    }

    verifyAuthorizationHeader(header: unknown): { _id: string; handle: string } {
        if (!header) {
            throw new BadRequest('Authorization header is missing')
        } else if (!(typeof header === 'string')) {
            throw new BadRequest('Authorization header is not a string')
        } else if (!header.startsWith('Bearer ')) {
            throw new BadRequest('Authorization header does not start with "Bearer "')
        } else {
            const token = header.replace('Bearer ', '')
            const user = this.verifyAccessToken(token)

            if (!user) throw new BadRequest('Invalid token')
            else return user as { _id: string; handle: string }
        }
    }

    verifyRefreshToken(refreshToken: string): { _id: string; handle: string } {
        // TODO: NON-PRODUCTION CODE

        if (!this.refreshTokens.includes(refreshToken)) {
            throw new BadRequest('Refresh token is not valid')
        }
        return jwt.verify(refreshToken, JWT_REFRESH_SECRET()) as { _id: string; handle: string }
    }

    invalidateRefreshToken(refreshToken: string) {
        this.refreshTokens = this.refreshTokens.filter((t) => t !== refreshToken)
    }
}

export default new AuthService()
