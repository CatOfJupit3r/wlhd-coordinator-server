import cors from 'cors'
import express from 'express'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'

import mongoose from 'mongoose'
import { authenticationMiddleware } from './middleware/AuthenticationMiddleware'

import LobbyCombatController from './controllers/LobbyCombatController'
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
app.use('/user', authenticationMiddleware, userRoutes)
app.use('/lobby', authenticationMiddleware, lobbyRoutes)
app.use('/combat', authenticationMiddleware, combatRoutes)
app.use('/entity', authenticationMiddleware, entityRoutes)

io.on('connection', (socket) => {
    const { gameId, userToken, lobbyId } = socket.handshake.query
    if (!gameId || !userToken) {
        console.log('Invalid connection')
        socket.disconnect()
    }
    console.log('Trying to establish connection: ', gameId, userToken)
    LobbyCombatController.manageSocket(socket, gameId as string, userToken as string, lobbyId as string)
})

export default server
