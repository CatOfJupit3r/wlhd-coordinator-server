import { Exception, Unauthorized } from '@models/ErrorModels'
import AuthService from '@services/AuthService'
import { NextFunction, Request, Response } from 'express'
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'

export const authenticationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.headers || !req.headers.authorization) {
            throw new Unauthorized('Authentication Failed', {
                reason: 'Authorization header is missing',
            })
        }
        const decoded = AuthService.verifyAuthorizationHeader(req.headers.authorization)

        if (!decoded) {
            throw new Unauthorized('Authentication Failed', {
                reason: 'Invalid token',
            })
        }
        next()
    } catch (err: unknown) {
        if (err instanceof TokenExpiredError)
            throw new Unauthorized('Authentication Failed', { reason: 'Token expired' })
        if (err instanceof JsonWebTokenError) {
            throw new Unauthorized('Authentication Failed', {
                reason: 'Invalid token',
            })
        }
        if (!(err instanceof Unauthorized)) console.log('Error in Authentication Middleware:', err)
        if (err instanceof Exception)
            throw new Unauthorized('Authentication Failed', {
                ...err.additionalData,
            })
        throw new Unauthorized('Authentication Failed', {
            reason: 'Unknown error',
        })
    }
}
