import {Socket as GameServerSocket} from 'net';
import {Socket as PlayerSocket} from 'socket.io';
import {GAME_SERVER_HOST, GAME_SOCKET_HOST, GAME_SOCKET_PORT} from "../configs/config";

export class GameSocket {
    private activePlayers: Map<string, PlayerSocket>;
    private socket: GameServerSocket;

    constructor() {
        this.socket = new GameServerSocket();
        this.activePlayers = new Map();
        this.setupListeners();
        try {
            this.connect();
        } catch (e: any) {
            console.log('Error connecting to game server', e.message);
        }
    }

    public connect() {
        /**
        * @throws {Error} if connection to game server fails
         */
        this.socket.connect(parseInt(GAME_SOCKET_PORT.toString()), GAME_SOCKET_HOST);
    }

    public handlePlayer (userToken: string, playerSocket: PlayerSocket) {
        if (this.activePlayers.has(userToken) &&
            this.activePlayers.get(userToken)?.connected) {
            playerSocket.emit('message', 'You are already connected');
            return
        }
        this.activePlayers.set(userToken, playerSocket);
        this.activePlayers.get(userToken)?.on('message', (data) => {
            this.socket.write(JSON.stringify(data));
        })
    }

    private handleCommand(data: any) {
        switch (data.command) {
            case 'clear_cache':
                break;
            case 'auth':
                this.socket.write(JSON.stringify({
                    command: 'auth',
                    token: "1222222223123111"
                }));
                break;
            default:
                console.log('Unknown command', data.command);
        }
    }

    private setupListeners() {
        this.socket.on('open', () => {
            console.log('Connected to game server');
        });
        this.socket.on('data', (data) => {
            const parsedData = JSON.parse(data.toString().replace(/'/g, '"'));
            console.log('Received data from game server', parsedData);
            this.handleCommand(parsedData);
        })
        this.socket.on('error', (err) => {
            if (err.message === 'read ECONNRESET') {
                console.log('Game server connection closed');
                this.activePlayers.forEach((player) => {
                    player.emit('message', 'Game server connection closed');
                })
                return;
            }
            console.log('Error from game server', err.message);
        });
        this.socket.on('close', () => {
            console.log('Game server connection closed');
            this.activePlayers.forEach((player) => {
                player.emit('message', 'Game server connection closed');
            })
        });
    }

    private sendToAllPlayers(data: any) {
        this.activePlayers.forEach((player) => {
            player.emit('message', data);
        });
    }

    private sendToPlayer(userToken: string, data: any) {
        if (this.activePlayers.has(userToken)) {
            this.activePlayers.get(userToken)?.emit('message', data);
        }
    }
}