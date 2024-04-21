import cors from 'cors'
import express from 'express'
import 'express-async-errors'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'

import mongoose from 'mongoose'
import LobbyController from './controllers/LobbyController'
import { errorHandlerMiddleware } from './middleware/ErrorHandlerMiddleware'
import combatRoutes from './routes/combatRoutes'
import entityRoutes from './routes/entityRoutes'
import indexRoutes from './routes/intexRoutes'
import lobbyRoutes from './routes/lobbyRoutes'
import translationRoutes from './routes/translationRoutes'
import userRoutes from './routes/userRoutes'

const app = express()
app.use(cors())

mongoose.connect('mongodb://localhost:27017/gameDB').catch((err) => {
    console.log(err)
    throw new Error('Database connection failed. Exiting...')
})

// both socket and http server are created on the same port
const server = http.createServer(app)
const io = new SocketIOServer(server, {
    cors: {
        origin: '*',
    },
})

app.use(express.json())

app.use('/', indexRoutes)
app.use('/translations', translationRoutes)
app.use('/user', userRoutes)
app.use('/lobby', lobbyRoutes)
app.use('/combat', combatRoutes)
app.use('/entity', entityRoutes)

io.on('connection', LobbyController.onConnection.bind(LobbyController))

app.use(errorHandlerMiddleware)

export default server
