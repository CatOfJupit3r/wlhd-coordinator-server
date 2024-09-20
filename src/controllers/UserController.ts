import AuthService from '@services/AuthService'
import UserService from '@services/UserService'
import { Request, Response } from 'express'

class UserController {
    async getProfile(req: Request, res: Response) {
        const user = AuthService.verifyAuthorizationHeader(req.headers.authorization)
        const { handle, createdAt } = await UserService.getProfile(user._id)
        const joined = await UserService.getJoinedLobbies(user._id)

        res.status(200).json({
            handle,
            createdAt,
            joined,
        })
    }

    async getJoinedLobbies(req: Request, res: Response) {
        const user = AuthService.verifyAuthorizationHeader(req.headers.authorization)
        const data = await UserService.getJoinedLobbies(user._id)

        res.status(200).json({
            joined: data,
        })
    }
}

export default new UserController()
