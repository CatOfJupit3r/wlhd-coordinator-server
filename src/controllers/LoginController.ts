import { Request, Response } from 'express'
import { BadRequest, Exception, Forbidden, InternalServerError } from '../models/ErrorModels'
import InputValidator from '../services/InputValidator'
import UserService from '../services/UserService'

class LoginController {
    async login(req: Request, res: Response) {
        const { handle, password } = req.body
        InputValidator.validateObject({ handle, password }, { handle: 'string', password: 'string' }, true)

        try {
            const { accessToken, refreshToken } = await UserService.loginWithPassword({ handle, password })
            return res.status(200).json({
                accessToken,
                refreshToken,
            })
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
        InputValidator.validateObject({ handle, password }, { handle: 'string', password: 'string' }, true)
        if (password.length < 8) throw new BadRequest('Password must be at least 8 characters long')

        try {
            await UserService.createAccount({ handle, password })
            const { accessToken, refreshToken } = await UserService.loginWithPassword({ handle, password })
            return res.status(200).json({ accessToken, refreshToken })
        } catch (error: unknown) {
            console.log(error)
            throw new Forbidden(error instanceof Error ? error.message : '')
        }
    }

    async token(req: Request, res: Response) {
        const { token: refreshToken } = req.body
        InputValidator.validateField({ key: 'refreshToken', value: refreshToken }, 'string', true)
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
