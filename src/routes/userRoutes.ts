import { createConfig, createRouter } from '@controllers/RouteInController'
import UserController from '@controllers/UserController'
import { authenticationMiddleware } from '@middlewares/AuthenticationMiddleware'

export default createRouter(
    [
        createConfig('get', '/profile', UserController.getProfile),
        createConfig('get', '/joined', UserController.getJoinedLobbies),
    ],
    [authenticationMiddleware]
)
