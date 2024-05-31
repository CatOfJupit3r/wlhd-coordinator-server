import cors from 'cors'
import express, { Express } from 'express'
import 'express-async-errors'

import characterRoutes from '../routes/characterRoutes'
import combatRoutes from '../routes/combatRoutes'
import indexRoutes from '../routes/intexRoutes'
import lobbyRoutes from '../routes/lobbyRoutes'
import translationRoutes from '../routes/translationRoutes'
import userRoutes from '../routes/userRoutes'

import { errorHandlerMiddleware } from '../middleware/ErrorHandlerMiddleware'
import assetRoutes from '../routes/assetRoutes'

const ExpressLoader = async (app: Express) => {
    app.use(cors())
    app.use(errorHandlerMiddleware)
    app.use(express.json())

    app.use('/', indexRoutes)
    app.use('/translations', translationRoutes)
    app.use('/user', userRoutes)
    app.use('/lobby', lobbyRoutes)
    app.use('/combat', combatRoutes)
    app.use('/character', characterRoutes)
    app.use('/assets', assetRoutes)
}

export default ExpressLoader
