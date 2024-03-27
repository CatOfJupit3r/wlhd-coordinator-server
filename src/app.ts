import cors from 'cors'
import express from 'express'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'

import mongoose, { ConnectOptions } from 'mongoose'
import { LobbyCombatController } from './controllers/LobbyCombatController'
import { TranslationController } from './controllers/TranslationController'
import { authenticationMiddleware } from './middleware/AuthenticationMiddleware'
import { createNewLobby } from './services/DatabaseService'

const app = express()
app.use(cors())

mongoose.connect('mongodb://localhost:27017/game', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
} as ConnectOptions)

// both socket and http server are created on the same port
const server = http.createServer(app)
const io = new SocketIOServer(server, {
    cors: {
        origin: '*',
    },
})

const translationController = new TranslationController()
const lobbyCombatController = new LobbyCombatController()

app.use(express.json())
app.use(authenticationMiddleware)

app.get('/', (req, res) => {
    res.send('Welcome. Actually, you are not!')
})
app.get('/translation', translationController.getTranslation.bind(translationController))
app.get('/translation-snippet', translationController.getTranslationSnippet.bind(translationController))
app.post('/reload-translations', translationController.reloadTranslations.bind(translationController))

app.post('/create_lobby', async (req, res) => {
    console.log('Creating lobby. Params:', req.body)
    const { lobby_name, gmHandle } = req.body
    const lobby_id = await createNewLobby(lobby_name, gmHandle)
    console.log('Lobby created', lobby_id)
    res.json({ result: 'ok', lobby_id })
})

app.get('/lobbies/:lobby_id', lobbyCombatController.getLobbyCombats.bind(lobbyCombatController))
app.post('/lobbies/:lobby_id/create_combat', lobbyCombatController.createLobbyCombat.bind(lobbyCombatController))
app.post('/lobbies/:lobby_id/', lobbyCombatController.getAllNicknames.bind(lobbyCombatController))

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
