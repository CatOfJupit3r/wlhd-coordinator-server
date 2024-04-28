import cors from 'cors'
import express, { Express } from 'express'
import 'express-async-errors'

import { errorHandlerMiddleware } from '../middleware/ErrorHandlerMiddleware'
import combatRoutes from '../routes/combatRoutes'
import entityRoutes from '../routes/entityRoutes'
import indexRoutes from '../routes/intexRoutes'
import lobbyRoutes from '../routes/lobbyRoutes'
import translationRoutes from '../routes/translationRoutes'
import userRoutes from '../routes/userRoutes'

const ExpressLoader = async (app: Express) => {
    app.use(cors())
    app.use(express.json())

    app.use('/', indexRoutes)
    app.use('/translations', translationRoutes)
    app.use('/user', userRoutes)
    app.use('/lobby', lobbyRoutes)
    app.use('/combat', combatRoutes)
    app.use('/entity', entityRoutes)

    app.use(errorHandlerMiddleware) // check if middleware is applied on login endpoints.
}

export default ExpressLoader
