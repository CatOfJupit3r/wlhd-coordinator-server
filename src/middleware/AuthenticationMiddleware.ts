import { NextFunction, Request, Response } from 'express'
import { Unauthorized } from '../models/ErrorModels'
import AuthService from '../services/AuthService'

export function authenticationMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.headers || !req.headers.authorization) {
            throw new Unauthorized('Authentication Failed')
        }
        const token = AuthService.removeBearerPrefix(req.headers.authorization)
        const decoded = AuthService.verifyAccessToken(token)

        if (!decoded) {
            throw new Unauthorized('Authentication Failed')
        }
        next()
    } catch (err) {
        if (!(err instanceof Unauthorized)) console.log('Error in authenticationMiddleware:', err)
        throw new Unauthorized('Authentication Failed')
    }
}
