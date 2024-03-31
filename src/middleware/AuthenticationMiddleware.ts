import { NextFunction, Request, Response } from 'express'
import AuthService from '../services/AuthService'

export function authenticationMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        if (!req.headers || !req.headers.authorization) {
            return res.status(401).json({
                message: 'Authentification Failed',
            })
        }
        const token = req.headers.authorization.replace('Bearer ', '')
        const decoded = AuthService.verifyAccessToken(token)

        if (!decoded) {
            return res.status(401).json({
                message: 'Authentification Failed',
            })
        }

        next()
    } catch (err) {
        return res.status(401).json({
            message: 'Authentification Failed',
        })
    }
}
