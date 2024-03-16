import {Socket as PlayerSocket} from 'socket.io';
import io from 'socket.io-client';
import {GAME_SERVER_HOST, GAME_SERVER_PORT, SECRET_TOKEN} from "../configs/config";
// import {
//     GameCommand,
//     ActionResultCommand,
//     GameFinishedCommand,
//     TakeActionCommand,
// } from "../models/GameCommand";


export class GameSocket {
    private activePlayers: Map<string, PlayerSocket>;
    private socket: any;
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
        this.gameId = gameId;
        this.clearDynamicCache = clearDynamicCache;
        this.activePlayers = new Map();
        this.socket = io(
            `http://${GAME_SERVER_HOST}:${GAME_SERVER_PORT}`,
            {
                path: '/sockets',
                retries: 3,
                autoConnect: false,
                query: {
                    lobby_id: gameId,
                    token: SECRET_TOKEN
                }
            }
        );
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
        this.setupListeners();
        this.socket.connect();
    }

    public handlePlayer (userToken: string, playerSocket: PlayerSocket) {
        if (this.activePlayers.has(userToken) &&
            this.activePlayers.get(userToken)?.connected) {
            playerSocket.emit('error', 'You are already connected');
            return
        }
        console.log('Player connected', userToken)
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
            this.sendToServer(
                "player_choice",
                {
                    "game_id": this.gameId,
                    "user_token": userToken,
                    "action": data
                }
            )
        })
        playerSocket.on("error", () => {
            console.log('Invalid event');
            playerSocket.emit('error', 'Invalid event');
        })

        this.activePlayers.set(userToken, playerSocket);
    }

    private setupListeners() {
        this.socket.on('connect', () => {
            this.active = true;
        });
        this.socket.on('request_authentication', () => {
            console.log('Game server requested authentication')
            this.sendToServer(
                "verify_socket",
                {
                    "lobby_id": this.gameId,
                    "token": SECRET_TOKEN
                }
            )
        })
        this.socket.on('authentication_result', (data: any) => {
            if (data.code === 200) {
                console.log('Game server verified');
            } else {
                console.log('Game server verification failed');
                console.log(data);
                this.onClose();
            }
        })
        this.socket.on("battle_started", () => {
            this.gameInProgress = true;
            this.sendToAllPlayers("game_started")
        })
        this.socket.on("round_update", (data: any) => {
            this.sendToAllPlayers("round_update", data)
        })
        this.socket.on("state_updated", (data: any) => {
            this.clearDynamicCache && this.clearDynamicCache(this.gameId);
            const { has_new_message, battlefield_updated } = data
            if (has_new_message) {
                this.sendToAllPlayers("new_message", {
                    "game_id": this.gameId,
                    "message": has_new_message
                })
            }
            if (battlefield_updated) {
                this.sendToAllPlayers("battlefield_updated")
            }
        })
        this.socket.on("take_action", (data: any) => {
            const { user_token, entity_id } = data
            this.currentPlayer = user_token;
            this.takeActionCommand = data;
            if (this.activePlayers.has(user_token)) {
                this.sendToPlayer(user_token, "take_action", {
                    "lobby_id": this.gameId,
                    "user_token": user_token,
                    "entity_id": entity_id
                });
            } else {
                console.log('Player not found', user_token);
                this.sendToServer("player_choice", {
                    "game_id": this.gameId,
                    "user_token": user_token,
                    "action": {
                        "action": "skip"
                    }
                })
            }
        })
        this.socket.on("action_result", (data: any) => {
            this.sendToPlayer(data.user_token, "action_result", data);
        })
        this.socket.on("battle_ended", (data: any) => {
            this.sendToAllPlayers("game_finished", data);
        })
        this.socket.on('error', (err: any) => {
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
        this.socket.on('*', function(packet: any){
            console.log('Received', packet);
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

    private sendToServer(event: string, payload?: object) {
        if (this.socket.connected) {
            this.socket.emit(event, payload);
        } else {
            console.log('Game server not connected');
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