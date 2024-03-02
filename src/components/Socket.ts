import {Socket as GameServerSocket} from 'net';
import {Socket as PlayerSocket} from 'socket.io';
import {GAME_SOCKET_HOST, GAME_SOCKET_PORT} from "../configs/config";
import {
    GameCommand,
    ActionResultCommand,
    GameFinishedCommand,
    TakeActionCommand,
} from "../models/GameCommand";

export class GameSocket {
    private activePlayers: Map<string, PlayerSocket>;
    private socket: GameServerSocket;
    private active: boolean = false;

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
        this.active = true;
    }

    public handlePlayer (userToken: string, playerSocket: PlayerSocket) {
        if (this.activePlayers.has(userToken) &&
            this.activePlayers.get(userToken)?.connected) {
            playerSocket.emit('message', 'You are already connected');
            return
        }
        this.activePlayers.set(userToken, playerSocket);
        this.activePlayers.get(userToken)?.on('message', (data: GameCommand) => {
            if (data.command !== 'take_action') {
                this.activePlayers.get(userToken)?.emit('error', 'Invalid command');
            } else {
                this.sendToServer(data);
            }
        })
    }

    private handleCommand(data: GameCommand) {
        switch (data.command) {
            case "game_started":
                this.sendToAllPlayers("game_started")
                break;
            case "round_update":
                this.sendToAllPlayers("round_update", data.payload)
                break;
            case "state_updated":
                this.sendToAllPlayers("state_updated", data.payload)
                break;
            case "take_action":
                const actionData = data as TakeActionCommand;
                const userToken = actionData.payload.user_token;
                if (this.activePlayers.has(userToken)) {
                    this.sendToPlayer(userToken, "take_action", actionData.payload);
                } else {
                    console.log('Player not found', userToken);
                    this.sendToServer({
                        "command": "take_action",
                        "payload": {
                            "user_token": userToken,
                            "action": {
                                "action": "skip_turn"
                            }
                        }
                    })
                }
                break;
            case "action_result":
                const resultData = data as ActionResultCommand;
                this.sendToPlayer(resultData.payload.user_token, "action_result", resultData.payload);
                break;
            case "game_finished":
                const finishedData = data as GameFinishedCommand;
                this.sendToAllPlayers("game_finished", finishedData.payload);
                break;
            case "request_verification":
                this.sendToServer({
                    "command": "verify_socket",
                    "payload": {
                        "game_id": "5000",
                        "species": "web",
                        "players": ["ADMIN"]
                    }
                })
                break;
            case "verification_result":
                if (data.payload?.code === 200) {
                    console.log('Game server verified');
                } else {
                    console.log('Game server verification failed');
                    console.log(data);
                    this.onClose();
                }
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
            try {
                const parsedData: GameCommand = JSON.parse(data.toString().replace(/'/g, '"'));
                this.handleCommand(parsedData);
            } catch (e: any) {
                console.log('Error parsing data from game server', e.message);
                return;
            }
        })
        this.socket.on('error', (err) => {
            if (err.message === 'read ECONNRESET') {
                this.onClose('Game server connection lost');
                return;
            }
            console.log('Error from game server', err.message);
        });
        this.socket.on('close', () => {
            console.log('Game server connection closed');
            this.onClose();
        });
    }

    private sendToAllPlayers(event: string, payload?: object) {
        this.activePlayers.forEach((player) => {
            payload && player.connected ? player.emit(event, payload) : player.emit(event);
        });
    }

    private sendToPlayer(userToken: string, event: string, payload?: object) {
        if (this.activePlayers.has(userToken)) {
            const player = this.activePlayers.get(userToken);
            payload && player?.connected ? player?.emit(event, payload) : player?.emit(event);
        }
    }

    private sendToServer(data: GameCommand) {
        try {
            this.socket.write(JSON.stringify(data));
        } catch (e: any) {
            console.log('Error sending data to game server', e.message);
            this.onClose('Game server connection lost');
        }
    }

    private onClose(message: string = 'Game server connection closed') {
        this.activePlayers.forEach((player) => {
            player.emit('close', message);
            player.disconnect();
        })
        this.activePlayers.clear();
        this.active = false;
    }
}