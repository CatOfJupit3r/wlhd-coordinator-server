import { Request, Response } from 'express'
import { ExtendedSchema } from 'just-enough-schemas'
import { BadRequest, Exception, Forbidden, InternalServerError } from '../models/ErrorModels'
import UserService from '../services/UserService'

const userSchema = new ExtendedSchema<{
    handle: string
    password: string
}>({ excess: 'forbid' })
userSchema.addStringField('handle')
userSchema.addStringField('password', {
    callback: (value: string) => {
        return value.length >= 8
    },
})

class LoginController {
    async login(req: Request, res: Response) {
        const validation = userSchema.check(req.body)
        if (!validation.success) {
            throw new BadRequest(validation.type, {
                reason:
                    validation.type === 'CALLBACK_FAILED'
                        ? 'Password must be at least 8 characters long'
                        : validation.message,
            })
        }
        const { handle, password } = validation.value

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
        const validation = userSchema.check(req.body)
        if (!validation.success) {
            throw new BadRequest(validation.type, {
                reason:
                    validation.type === 'CALLBACK_FAILED'
                        ? 'Password must be at least 8 characters long'
                        : validation.message,
            })
        }
        const { handle, password } = validation.value

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
        if (!refreshToken || typeof refreshToken !== 'string') throw new Forbidden()

        try {
            const { accessToken } = UserService.loginWithRefreshToken(refreshToken)
            return res.status(200).json({ accessToken })
        } catch (error) {
            if (error instanceof Exception) throw error
            else {
                console.log(error)
                throw new Forbidden()
            }
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
