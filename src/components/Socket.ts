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
    private gameInProgress: boolean = false;
    private currentPlayer: string = "";
    private takeActionCommand: any;

    private readonly clearDynamicCache?: (gameId: string) => void;
    private readonly gameId: string;

    constructor(
        gameId: string,
        clearDynamicCache?: (game_id: string) => void
    ) {
        this.gameInProgress = false;
        this.socket = new GameServerSocket();
        this.gameId = gameId;
        this.clearDynamicCache = clearDynamicCache;
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
        if (this.gameInProgress) {
            playerSocket.emit('game_started')
        }
        if (this.currentPlayer === userToken) {
            playerSocket.emit('take_action', this.takeActionCommand);
        }
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
                this.gameInProgress = true;
                this.sendToAllPlayers("game_started")
                break;
            case "round_update":
                this.sendToAllPlayers("round_update", data)
                break;
            case "state_updated":
                this.clearDynamicCache && this.clearDynamicCache(this.gameId);
                this.sendToAllPlayers("state_updated", data)
                break;
            case "take_action":
                const actionData = data as TakeActionCommand;
                const userToken = actionData.payload.user_token;
                this.currentPlayer = userToken;
                this.takeActionCommand = actionData;
                if (this.activePlayers.has(userToken)) {
                    this.sendToPlayer(userToken, "take_action", actionData);
                } else {
                    console.log('Player not found', userToken);
                    this.sendToServer({
                        "command": "take_action",
                        "payload": {
                            "user_token": userToken,
                            "action": {
                                "action": "skip"
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
                        "game_id": this.gameId,
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
            let depth = 0;
            let startIdx = -1;

            for (let i = 0; i < buffer.length; i++) {
                if (buffer[i] === '{') {
                    if (depth === 0) {
                        startIdx = i;
                    }
                    depth++;
                } else if (buffer[i] === '}') {
                    depth--;
                    if (depth === 0 && startIdx !== -1) {
                        const jsonStr = buffer.substring(startIdx, i + 1);
                        const parsedData = JSON.parse(jsonStr);
                        parsedObjects.push(parsedData);
                        startIdx = -1;
                    }
                }
            }

            return parsedObjects;
        } catch (e: any) {
            console.log('Error parsing data from game server', e.message);
            console.log(data.toString());
            return [];
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