import cors from 'cors'
import express, { Express } from 'express'
import 'express-async-errors'

import gameRoutes from '@routes/gameRoutes'
import indexRoutes from '@routes/indexRoutes'
import lobbyRoutes from '@routes/lobbyRoutes'
import userRoutes from '@routes/userRoutes'

import { errorHandlerMiddleware } from '@middlewares/ErrorHandlerMiddleware'

const ExpressLoader = async (app: Express) => {
    app.use(cors())
    app.use(express.json())

    app.use('/', indexRoutes)
    app.use('/user', userRoutes) // routes for THE user, not users in general
    app.use('/lobbies', lobbyRoutes)
    app.use('/game', gameRoutes) // routes related to game server data, not game lobbies

    app.use(errorHandlerMiddleware)
}

export default ExpressLoader
