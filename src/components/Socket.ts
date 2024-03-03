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

    public isActive() {
        return this.active && this.socket.readable && this.socket.writable;
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
            playerSocket.emit('error', 'You are already connected');
            return
        }
        console.log('Player connected', userToken)
        // we set up players BEFORE we add players to active sockets.
        // I DON'T KNOW WHY IT DOESN'T WORK OTHERWISE
        // try {
        //     this.sendNewPlayerToServer(userToken, playerSocket);
        // }
        playerSocket.on('take_action', (data: any) => {
            console.log("Received message from Player. Sending to server...")
            if (data === undefined) {
                playerSocket.emit('error', 'Invalid payload');
            }
            this.sendToServer({
                "command": "take_action",
                "payload": {
                    "user_token": userToken,
                    "action": data
                }
            })
        })
        playerSocket.on("error", () => {
            console.log('Invalid event');
            playerSocket.emit('error', 'Invalid event');
        })
        this.activePlayers.set(userToken, playerSocket);
    }

    private handleCommand(data: GameCommand) {
        switch (data.command) {
            case "game_started":
                this.sendToAllPlayers("game_started")
                break;
            case "round_update":
                this.sendToAllPlayers("round_update", data)
                break;
            case "state_updated":
                this.sendToAllPlayers("state_updated", data)
                break;
            case "take_action":
                const actionData = data as TakeActionCommand;
                const userToken = actionData.payload.user_token;
                if (this.activePlayers.has(userToken)) {
                    this.sendToPlayer(userToken, "take_action", actionData);
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
                this.sendToAllPlayers("game_finished", finishedData);
                break;
            case "request_authentication":
                this.sendToServer({
                    "command": "verify_socket",
                    "payload": {
                        "game_id": "555",
                        "species": "web",
                        "players": ["ADMIN"]
                    }
                })
                break;
            case "authentication_result":
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
                const parsedData = this.parseData(data);
                parsedData.forEach((data) => {
                    this.handleCommand(data);
                })
            } catch (e: any) {
                console.log('Error parsing data from game server', e.message);
                console.log(data.toString());
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

    private parseData(data: Buffer): GameCommand[] {
        try {
            const parsedObjects: GameCommand[] = [];
            let buffer = data.toString().replace(/'/g, '"');
            while (buffer.includes('}')) {
                const startIdx = buffer.indexOf('{');
                const endIdx = buffer.indexOf('}');
                if (startIdx !== -1 && endIdx !== -1) {
                    const jsonStr = buffer.slice(startIdx, endIdx + 1);
                    const parsedData = JSON.parse(jsonStr);
                    parsedObjects.push(parsedData);
                    buffer = buffer.slice(endIdx + 1);
                } else {
                    break;
                }
            }
            return parsedObjects
        } catch (e: any) {
            console.log('Error parsing data from game server', e.message);
            console.log(data.toString());
            return []
        }
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

    // private addNewPlayer(userToken: string, playerSocket: PlayerSocket) {
    //
    // }
}