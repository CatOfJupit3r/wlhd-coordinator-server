import { Router } from 'express'
import UserService from '../services/UserService'

const router = Router()

router.get('/joined_lobbies', async (req, res) => {
    const authHeader = req.header('Authorization')

    if (!authHeader) {
        res.status(401).send('Unauthorized')
        return
    }
    const token = authHeader.split(' ')[1]
    const data = await UserService.getJoinedLobbiesInfo(token)

    res.json(data)
})

export default router
