import { Router } from 'express'
import UserService from '../services/UserService'

const route = Router()

route.get('/', (req, res) => {
    res.send('Welcome. Actually, you are not!')
})

route.post('/register', async (req, res) => {
    const { handle, password } = req.body
    // TODO: validate email and password ?
    try {
        await UserService.createAccount({ handle, password })
        const { accessToken, refreshToken } = await UserService.loginWithPassword({ handle, password })
        return res.json({ accessToken, refreshToken })
    } catch (error: any) {
        console.log(error)
        res.status(403)
        return res.json({
            error: error.message,
        })
    }
})

route.post('/login', async (req, res) => {
    if (!req.body.handle || !req.body.password) {
        res.status(400).json({ message: 'Missing parameters!' })
        return
    }

    const { handle, password } = req.body

    try {
        const data = await UserService.loginWithPassword({ handle, password })
        return res.json(data)
    } catch (error: any) {
        if (error.message === 'User not found') {
            return res.status(404).json({ message: 'User not found' })
        } else if (error.message === 'Incorrect password') {
            return res.status(403).json({ message: 'Incorrect password' })
        } else {
            console.log(error)
            return res.status(500).json({ message: 'Internal server error' })
        }
    }
})

route.post('/token', (req, res) => {
    const { token: refreshToken } = req.body
    if (!refreshToken) return res.sendStatus(403)

    try {
        const { accessToken } = UserService.loginWithRefreshToken(refreshToken)
        return res.json({ accessToken })
    } catch (error) {
        console.log(error)
        return res.sendStatus(403)
    }
})

route.post('/logout', (req, res) => {
    const { token: refreshToken } = req.body
    if (!refreshToken) return res.sendStatus(403)

    try {
        UserService.logout(refreshToken)
        return res.sendStatus(200)
    } catch (error) {
        console.log(error)
        return res.sendStatus(403)
    }
})

export default route
