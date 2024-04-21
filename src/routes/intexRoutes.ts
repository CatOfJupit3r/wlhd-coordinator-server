import { Router } from 'express'
import LoginController from '../controllers/LoginController'

const route = Router()

route.get('/', (req, res) => {
    res.send('Welcome. Actually, you are not!')
})

route.post('/register', LoginController.register.bind(LoginController))
route.post('/login', LoginController.login.bind(LoginController))
route.post('/logout', LoginController.logout.bind(LoginController))
route.post('/token', LoginController.token.bind(LoginController))

export default route
