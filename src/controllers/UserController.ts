import { Request, Response } from 'express'
import AuthService from '../services/AuthService'
import UserService from '../services/UserService'

class UserController {
    async getProfile(req: Request, res: Response) {
        const user = AuthService.verifyAuthorizationHeader(req.headers.authorization)
        const { handle, createdAt } = await UserService.getProfile(user._id)

        res.status(200).json({
            handle,
            createdAt,
        })
    }

    async getJoinedLobbies(req: Request, res: Response) {
        const user = AuthService.verifyAuthorizationHeader(req.headers.authorization)
        const data = await UserService.getJoinedLobbiesInfo(user._id)

        res.status(200).json({
            joinedLobbies: data,
        })
    }
}

export default new UserController()
