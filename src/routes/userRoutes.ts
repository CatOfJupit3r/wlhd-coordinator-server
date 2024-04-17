import { Router } from 'express'
import AuthService from '../services/AuthService'
import UserService from '../services/UserService'

const router = Router()

router.get('/joined_lobbies', async (req, res) => {
    if (!req.headers.authorization) {
        res.status(401).json({ message: 'Unauthorized' })
        return
    }
    const token = AuthService.removeBearerPrefix(req.headers.authorization)
    const data = await UserService.getJoinedLobbiesInfo(token)

    res.json({
        joinedLobbies: data,
    })
})

export default router
