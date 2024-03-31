import cors from 'cors'
import express from 'express'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'

import mongoose from 'mongoose'
import { authenticationMiddleware } from './middleware/AuthenticationMiddleware'

import combatRoutes from './routes/combatRoutes'
import entityRoutes from './routes/entityRoutes'
import indexRoutes from './routes/intexRoutes'
import lobbyRoutes from './routes/lobbyRoutes'
import translationRoutes from './routes/translationRoutes'

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
app.use('/lobby', authenticationMiddleware, lobbyRoutes)
app.use('/combat', authenticationMiddleware, combatRoutes)
app.use('/entity', authenticationMiddleware, entityRoutes)

io.on('connection', (socket) => {
    const gameId = socket.handshake.query.game_id
    const userToken = socket.handshake.query.user_token
    console.log('Connected', gameId, userToken)
    if (!gameId || !userToken) {
        console.log('Invalid connection')
        return
    }
})

export default server
