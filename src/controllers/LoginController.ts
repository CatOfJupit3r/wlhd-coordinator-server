import { createRouteInController } from '@controllers/RouteInController'
import { Exception, Forbidden, InternalServerError } from '@models/ErrorModels'
import UserService from '@services/UserService'
import { Request, Response } from 'express'
import { z } from 'zod'

export const LoginSchema = z.object({
    handle: z.string().min(3),
    password: z.string().min(8),
})

class LoginController {
    login = createRouteInController(
        async (req: Request, res: Response) => {
            const { handle, password } = req.body

            try {
                const { accessToken, refreshToken } = await UserService.loginWithPassword({ handle, password })
                res.status(200).json({
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
        },
        { body: LoginSchema }
    )

    register = createRouteInController(
        async (req: Request, res: Response) => {
            const { handle, password } = req.body

            try {
                await UserService.createAccount({ handle, password })
                const { accessToken, refreshToken } = await UserService.loginWithPassword({ handle, password })
                res.status(200).json({
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
        },
        { body: LoginSchema }
    )

    token = createRouteInController(
        async (req: Request, res: Response) => {
            const { token: refreshToken } = req.body
            if (!refreshToken || typeof refreshToken !== 'string') throw new Forbidden()

            try {
                const { accessToken } = UserService.loginWithRefreshToken(refreshToken)
                res.status(200).json({ accessToken })
            } catch (error) {
                if (error instanceof Exception) throw error
                else {
                    console.log(error)
                    throw new Forbidden()
                }
            }
        },
        {
            body: z.object({
                token: z.string().min(1),
            }),
        }
    )

    logout = createRouteInController(
        async (req: Request, res: Response) => {
            const { token: refreshToken } = req.body

            try {
                UserService.logout(refreshToken)
                res.status(200).json({ message: 'Logged out' })
            } catch (error) {
                console.log(error)
                throw new Forbidden()
            }
        },
        {
            body: z.object({
                token: z.string().min(1),
            }),
        }
    )
}

export default new LoginController()
