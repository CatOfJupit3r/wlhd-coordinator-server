import cors from 'cors'
import express from 'express'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'

import mongoose from 'mongoose'
import { LobbyCombatController } from './controllers/LobbyCombatController'
import { TranslationController } from './controllers/TranslationController'
import { authenticationMiddleware } from './middleware/AuthenticationMiddleware'
import { addPlayerToLobby, createNewEntity, createNewLobby } from './services/DatabaseService'

const app = express()
app.use(cors())

mongoose.connect('mongodb://localhost:27017/game')

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
    const { lobby_name, gm_id } = req.body
    const lobby_id = await createNewLobby(lobby_name, gm_id)
    console.log('Lobby created', lobby_id)
    res.json({ result: 'ok', lobby_id })
})

app.post('/entities/create', async (req, res) => {
    console.log('Creating entity. Params:', req.body)
    const { descriptor, attributes, customAttributes } = req.body
    const entity_id = await createNewEntity(descriptor, attributes, customAttributes)
    res.json({ result: 'ok', entity_id })
})

app.post('/lobbies/:lobby_id/add_player', async (req, res) => {
    console.log('Adding player to lobby. Params:', req.body)
    const { lobby_id } = req.params
    const { player_id, nickname, mainCharacter } = req.body
    await addPlayerToLobby(lobby_id, player_id, nickname, mainCharacter)
    res.json({ result: 'ok', player_id })
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
