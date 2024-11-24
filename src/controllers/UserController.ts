import { CDN_SECRET_TOKEN, CDN_URL } from '@config/env'
import { createRouteInController } from '@controllers/RouteInController'
import { BadRequest, NotFound } from '@models/ErrorModels'
import AuthService from '@services/AuthService'
import UserService from '@services/UserService'
import axios, { isAxiosError } from 'axios'
import { Request, Response } from 'express'
import { z } from 'zod'

// const sanitizeColor = (color: string) => {
//     return color.replace('#', '%23')
// }

class UserController {
    getProfile = createRouteInController(async (req: Request, res: Response) => {
        const user = AuthService.verifyAuthorizationHeader(req.headers.authorization)
        const { handle, createdAt } = await UserService.getProfile(user._id)
        const joined = await UserService.getJoinedLobbies(user._id)

        res.status(200).json({
            handle,
            createdAt,
            joined,
        })
    })

    getJoinedLobbies = createRouteInController(async (req: Request, res: Response) => {
        const user = AuthService.verifyAuthorizationHeader(req.headers.authorization)
        const data = await UserService.getJoinedLobbies(user._id)

        res.status(200).json({
            joined: data,
        })
    })

    getUserAvatar = createRouteInController(
        async (req: Request, res: Response) => {
            const { handle } = req.params
            const user = await UserService.findByHandle(handle, false)

            if (!user) {
                throw new NotFound(`User with handle ${handle} not found`)
            }

            const { avatar } = user

            if (!avatar) {
                throw new NotFound(`User with handle ${handle} has no avatar`)
            }

            if (avatar.preferred === 'static') {
                res.status(200).json({
                    type: 'static',
                    content: avatar.url,
                })
            } else {
                let proxy
                try {
                    proxy = await axios.get(`${CDN_URL}/avatars`, {
                        params: {
                            pattern: avatar.generated.pattern,
                            primary: avatar.generated.mainColor,
                            secondary: avatar.generated.secondaryColor,
                        },
                        headers: {
                            Authorization: `Bearer ${CDN_SECRET_TOKEN}`,
                        },
                        responseType: 'arraybuffer',
                    })
                } catch (e) {
                    if (!isAxiosError(e)) {
                        throw e
                    }
                    // if error code is 404, try generating
                    if (e.response?.status === 404) {
                        proxy = await axios.post(
                            `${CDN_URL}/avatars`,
                            {
                                pattern: avatar.generated.pattern,
                                primary: avatar.generated.mainColor,
                                secondary: avatar.generated.secondaryColor,
                            },
                            {
                                headers: {
                                    Authorization: `Bearer ${CDN_SECRET_TOKEN}`,
                                },
                                responseType: 'arraybuffer',
                            }
                        )
                    } else {
                        throw new BadRequest('Failed to generate avatar')
                    }
                }
                const base64Content = Buffer.from(proxy.data).toString('base64')
                res.status(proxy.status).json({
                    type: 'generated',
                    content: base64Content,
                })
            }
        },
        {
            params: z.object({
                handle: z.string(),
            }),
        }
    )
}

export default new UserController()
