import { createRouteInController } from '@controllers/RouteInController'
import { NotFound } from '@models/ErrorModels'
import AuthService from '@services/AuthService'
import CDNService from '@services/CDNService'
import UserService from '@services/UserService'
import { Request, Response } from 'express'
import { z } from 'zod'

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
                res.status(200).json({
                    type: 'generated',
                    content: await CDNService.getAvatarFile(avatar),
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
