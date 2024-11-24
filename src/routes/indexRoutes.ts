import LoginController from '@controllers/LoginController'
import { createConfig, createRouter } from '@controllers/RouteInController'

export default createRouter([
    createConfig('get', '/', (req, res) => {
        res.send('Welcome. Actually, you are not!')
    }),
    createConfig('get', '/health', (req, res) => {
        res.status(200).json({ status: 'OK' })
    }),
    createConfig('post', '/register', LoginController.register),
    createConfig('post', '/login', LoginController.login),
    createConfig('post', '/logout', LoginController.logout),
    createConfig('post', '/token', LoginController.token),
])
