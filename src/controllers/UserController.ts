import { Request, Response } from 'express'
import AuthService from '../services/AuthService'
import UserService from '../services/UserService'

class UserController {
    async getProfile(req: Request, res: Response) {
        const token = AuthService.removeBearerPrefix(req.headers.authorization as string)
        const user = AuthService.verifyAccessToken(token)
        const { handle, createdAt } = await UserService.getProfile(user._id)

        res.status(200).json({
            handle,
            createdAt,
        })
    }

    async getJoinedLobbies(req: Request, res: Response) {
        const token = AuthService.removeBearerPrefix(req.headers.authorization as string)
        const user = AuthService.verifyAccessToken(token)
        const data = await UserService.getJoinedLobbiesInfo(user._id)

        res.status(200).json({
            joinedLobbies: data,
        })
    }
}

export default new UserController()
