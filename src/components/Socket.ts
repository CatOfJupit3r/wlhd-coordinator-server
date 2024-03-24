import { Socket as PlayerSocket } from 'socket.io';
import io, { Socket } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { GAME_SERVER_URL, SECRET_TOKEN } from '../configs/config';
// import {
//     GameCommand,
//     ActionResultCommand,
//     GameFinishedCommand,
//     TakeActionCommand,
// } from "../models/GameCommand";

export class GameSocket {
    private activePlayers: Map<string, PlayerSocket>;
    private socket: Socket<DefaultEventsMap, DefaultEventsMap>;
    private active: boolean = false;
    private gameInProgress: boolean = false;
    private currentPlayer: string = '';
    private takeActionCommand: any;

    private readonly clearDynamicCache?: (gameId: string) => void;
    private readonly gameId: string;

    constructor(gameId: string, clearDynamicCache?: (game_id: string) => void) {
        this.gameInProgress = false;
        this.gameId = gameId;
        this.clearDynamicCache = clearDynamicCache;
        this.activePlayers = new Map();
        this.socket = io(GAME_SERVER_URL, {
            path: '/sockets',
            autoConnect: false,
            query: {
                lobby_id: gameId,
                token: SECRET_TOKEN,
            },
        });
        try {
            this.connect();
        } catch (e: any) {
            console.log('Error connecting to game server', e.message);
        }
    }

    public isActive() {
        return this.socket.active;
    }

    public connect() {
        /**
         * @throws {Error} if connection to game server fails
         */
        this.setupListeners();
        this.socket.connect();
    }

    public handlePlayer(userToken: string, playerSocket: PlayerSocket) {
        if (this.activePlayers.has(userToken) && this.activePlayers.get(userToken)?.connected) {
            playerSocket.emit('error', 'You are already connected');
            return;
        }
        console.log('Player connected', userToken);
        playerSocket.on('take_action', (data: { [key: string]: string }) => {
            console.log('Received message from Player. Sending to server...');
            if (data === undefined) {
                playerSocket.emit('error', 'Invalid payload');
            }
            this.sendToServer('player_choice', {
                game_id: this.gameId,
                user_token: userToken,
                choices: data,
            });
        });
        playerSocket.on('debug', () => {
            this.currentPlayer === userToken &&
                this.sendToServer('player_choice', {
                    game_id: this.gameId,
                    user_token: userToken,
                    choices: {
                        action: 'builtins:skip',
                    },
                });
            this.currentPlayer = '';
        });
        playerSocket.on('unable_to_take_action', () => {
            this.currentPlayer === userToken &&
                this.sendToServer('player_choice', {
                    game_id: this.gameId,
                    user_token: userToken,
                    choices: {
                        action: 'builtins:skip',
                    },
                });
        });
        playerSocket.on('error', () => {
            console.log('Invalid event');
            playerSocket.emit('error', 'Invalid event');
        });
        this.activePlayers.set(userToken, playerSocket);
        if (this.gameInProgress) {
            playerSocket.emit('battle_started');
        }
        if (this.currentPlayer === userToken) {
            playerSocket.emit('take_action', this.takeActionCommand);
        }
    }

    private setupListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to game server');
            this.active = true;
        });
        this.socket.on('disconnect', () => {
            console.log('Disconnected from game server');
            this.onClose();
        });
        this.socket.on('request_authentication', () => {
            console.log('Game server requested authentication');
            this.sendToServer('verify_socket', {
                lobby_id: this.gameId,
                token: SECRET_TOKEN,
            });
        });
        this.socket.on('authentication_result', (data: any) => {
            if (data.code === 200) {
                console.log('Game server verified');
            } else {
                console.log('Game server verification failed');
                console.log(data);
                this.onClose();
            }
        });
        this.socket.on('battle_started', () => {
            console.log('Game has started');
            this.gameInProgress = true;
            this.sendToAllPlayers('battle_started');
            this.clearDynamicCache && this.clearDynamicCache(this.gameId);
        });
        this.socket.on('round_update', (data: any) => {
            console.log('Round updated', data);
            this.sendToAllPlayers('round_update', data);
        });
        this.socket.on('state_updated', (data: any) => {
            console.log('State updated', data);
            this.clearDynamicCache && this.clearDynamicCache(this.gameId);
            const { message, battlefield_updated } = data;
            if (message) {
                this.sendToAllPlayers('new_message', {
                    message: message,
                });
            }
            if (battlefield_updated) {
                this.sendToAllPlayers('battlefield_updated');
            }
        });
        this.socket.on('player_turn', (data: any) => {
            console.log('Player turn', data);
            const { user_token, entity_id } = data;
            this.currentPlayer = user_token;
            this.takeActionCommand = data;
            if (this.activePlayers.has(user_token)) {
                this.sendToPlayer(user_token, 'take_action', {
                    lobby_id: this.gameId,
                    user_token: user_token,
                    entity_id: entity_id,
                });
            } else {
                console.log('Player not found', user_token);
                this.sendToServer('player_choice', {
                    lobby_id: this.gameId,
                    user_token: user_token,
                    choices: {
                        action: 'builtins:skip',
                    },
                });
            }
        });
        this.socket.on('action_result', (data: any) => {
            console.log('Action result', data);
            this.sendToPlayer(data.user_token, 'action_result', data);
        });
        this.socket.on('battle_ended', (data: any) => {
            console.log('Game has ended', data);
            this.sendToAllPlayers('battle_ended', data);
        });
        this.socket.on('error', (err: any) => {
            console.log('Error from game server', err.message);
        });
        this.socket.on('close', () => {
            console.log('Game server connection closed');
            this.onClose();
            for (const player of this.activePlayers.values()) {
                player.emit('close', 'Game server connection closed');
                player.disconnect();
            }
        });
        this.socket.on('ping', () => {
            console.log('Ping received');
        });
        this.socket.on('*', function (packet: any) {
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
        });
        this.activePlayers.clear();
        this.active = false;
    }
}
