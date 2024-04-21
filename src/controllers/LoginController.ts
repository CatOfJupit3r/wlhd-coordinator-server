import { Request, Response } from 'express'
import { BadRequest, Exception, Forbidden, InternalServerError } from '../models/ErrorModels'
import UserService from '../services/UserService'

class LoginController {
    async login(req: Request, res: Response) {
        if (!req.body.handle || !req.body.password) throw new BadRequest('Missing parameters!')
        const { handle, password } = req.body

        try {
            const data = await UserService.loginWithPassword({ handle, password })
            return res.json(data)
        } catch (error) {
            if (error instanceof Exception) throw error
            else {
                console.log(error)
                throw new InternalServerError('Something went wrong')
            }
        }
    }

    async register(req: Request, res: Response) {
        const { handle, password } = req.body

        try {
            await UserService.createAccount({ handle, password })
            const { accessToken, refreshToken } = await UserService.loginWithPassword({ handle, password })
            return res.status(200).json({ accessToken, refreshToken })
        } catch (error: any) {
            console.log(error)
            throw new Forbidden(error.message)
        }
    }

    async token(req: Request, res: Response) {
        const { token: refreshToken } = req.body
        if (!refreshToken) throw new Forbidden()

        try {
            const { accessToken } = UserService.loginWithRefreshToken(refreshToken)
            return res.status(200).json({ accessToken })
        } catch (error) {
            console.log(error)
            throw new Forbidden()
        }
    }

    async logout(req: Request, res: Response) {
        const { token: refreshToken } = req.body
        if (!refreshToken) throw new Forbidden()

        try {
            UserService.logout(refreshToken)
            return res.status(200).json({ message: 'Logged out' })
        } catch (error) {
            console.log(error)
            throw new Forbidden()
        }
    }
}

export default new LoginController()
