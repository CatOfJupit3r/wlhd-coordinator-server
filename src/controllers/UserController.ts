import { Request, Response } from 'express'
import { Unauthorized } from '../models/ErrorModels'
import AuthService from '../services/AuthService'
import UserService from '../services/UserService'

class UserController {
    async getProfile(req: Request, res: Response) {
        if (!req.headers.authorization) throw new Unauthorized('No authorization header') // although this case is already handled by authenticationMiddleware
        const token = AuthService.removeBearerPrefix(req.headers.authorization)
        const { handle, createdAt } = await UserService.getProfile(token)

        res.status(200).json({
            handle,
            createdAt,
        })
    }

    async getJoinedLobbies(req: Request, res: Response) {
        if (!req.headers.authorization) throw new Unauthorized('No authorization header') // although this case is already handled by authenticationMiddleware
        const token = AuthService.removeBearerPrefix(req.headers.authorization)
        const data = await UserService.getJoinedLobbiesInfo(token)

        res.status(200).json({
            joinedLobbies: data,
        })
    }
}

export default new UserController()
