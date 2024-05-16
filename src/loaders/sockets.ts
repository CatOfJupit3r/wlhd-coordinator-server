import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import LobbyController from '../controllers/LobbyController'

const SocketLoader = async (server: http.Server) => {
    const io = new SocketIOServer(server, {
        cors: { origin: '*' },
    })

    io.on('connection', LobbyController.onConnection.bind(LobbyController))
}

export default SocketLoader
