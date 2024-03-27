import { Socket as PlayerSocket } from 'socket.io'
import io, { Socket } from 'socket.io-client'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'
import { GAME_SERVER_URL, SECRET_TOKEN } from '../configs/config'

import { Battlefield, BattlefieldEntitiesInformation, EntityAction, GameMessagesContainer } from '../models/GameModels'
import { fetchBattlefield, fetchMessage } from '../utils/fetchers'

export class LobbyCombat {
    private players: Map<string, PlayerSocket | null>
    private gameSocket: Socket<DefaultEventsMap, DefaultEventsMap>
    private gameId: string
    private gameState: {
        round_count: number
        messages: GameMessagesContainer
        battleResult: 'pending' | 'ongoing' | 'builtins:win' | 'builtins:lose' | 'builtins:draw' | 'builtins:flee'
        currentBattlefield: Battlefield
        allEntitiesInfo: BattlefieldEntitiesInformation // info about all entities.
        entityActions: EntityAction | null // keeps json of possible entity action in order to not fetch them each event
        currentPlayer: string | null // handle of current player. Supplied by game servers
        currentEntity: string | null // entity_id of current entity. Supplied by game servers
    }
    private readonly gmHandle: string
    private readonly removeSelf: () => void

    constructor(combatPreset: string, removeSelf: () => void, gmHandle: string, players: Array<string>) {
        this.gmHandle = ''
        this.players = new Map()
        players.forEach((player) => {
            this.players.set(player, null)
        })
        this.removeSelf = removeSelf
        this.gameSocket = io(GAME_SERVER_URL, {
            path: '/sockets',
            autoConnect: false,
            query: {
                combatPreset,
                token: SECRET_TOKEN,
            },
        })
    }

    public isActive() {
        return this.gameSocket.active
    }

    public connect() {
        /**
         * @throws {Error} if connection to game server fails
         */
        this.setupListeners()
        this.gameSocket.connect()
    }

    private sendToAllPlayers(event: string, payload?: object) {
        this.players.forEach((player) => {
            if (!player) return
            payload && player.connected ? player.emit(event, payload) : player.emit(event)
        })
    }

    private sendToPlayer(userToken: string, event: string, payload?: object) {
        if (this.players.has(userToken)) {
            const player = this.players.get(userToken)
            payload && player?.connected ? player?.emit(event, payload) : player?.emit(event)
        }
    }

    private sendToGm(event: string, payload?: object): boolean {
        if (this.players.has(this.gmHandle)) {
            const gm = this.players.get(this.gmHandle)
            payload && gm?.connected ? gm?.emit(event, payload) : gm?.emit(event)
            return true
        }
        return false
    }

    private sendToServer(event: string, payload?: object) {
        if (this.gameSocket.connected) {
            this.gameSocket.emit(event, payload)
        } else {
            console.log('Game server not connected')
        }
    }

    private onClose(message: string = 'Game server connection closed') {
        this.players.forEach((player) => {
            if (!player) return
            player.emit('close', message)
            player.disconnect()
        })
        this.players.clear()
        this.removeSelf()
    }

    private addNewMessage(message: string) {
        fetchMessage(this.gameId, message)
            .then((data) => {
                this.gameState.messages = {
                    ...this.gameState.messages,
                    ...data,
                }
                this.sendToAllPlayers('new_message', {
                    message: data,
                })
            })
            .catch((e) => {
                console.log('Error fetching message', e.message)
            })
    }

    private updateBattlefield() {
        fetchBattlefield(this.gameId)
            .then((data) => {
                this.gameState.currentBattlefield = data
                this.sendToAllPlayers('battlefield_update', {
                    battlefield: data,
                })
            })
            .catch((e) => {
                console.log('Error fetching battlefield', e.message)
            })
    }

    public handlePlayer(userToken: string, playerSocket: PlayerSocket) {
        if (this.players.has(userToken) && this.players.get(userToken)?.connected) {
            playerSocket.emit('error', 'You are already connected')
            return
        }
        console.log('Player connected', userToken)
        playerSocket.use((packet, next) => {
            if (packet[0] === 'error') {
                console.log('Error from player', packet[1])
            } else if (packet[0] in ['take_action', 'skip']) {
                if (this.gameState && this.gameState.battleResult === 'ongoing') {
                    next()
                } else {
                    playerSocket.emit('error', 'Game is not active!')
                }
            } else {
                console.log('Invalid event from player', packet[0])
                playerSocket.emit('error', 'Invalid event')
            }
            next()
        })
        playerSocket.on('take_action', (data: { [key: string]: string }) => {
            console.log('Received message from Player. Sending to server...')
            if (data === undefined) {
                playerSocket.emit('error', 'Invalid payload')
            }
            this.sendToServer('player_choice', {
                game_id: this.gameId,
                user_token: userToken,
                choices: data,
            })
        })
        playerSocket.on('skip', () => {
            this.gameState.currentPlayer === userToken &&
                this.sendToServer('player_choice', {
                    game_id: this.gameId,
                    user_token: userToken,
                    choices: {
                        action: 'builtins:skip',
                    },
                })
        })
        playerSocket.on('error', () => {
            console.log('Invalid event')
            playerSocket.emit('error', 'Invalid event')
        })
        playerSocket.on('game_state', () => {
            playerSocket.emit('game_state', this.gameState)
        })
        this.players.set(userToken, playerSocket)
    }

    private setupListeners() {
        this.gameSocket.on('connect', () => {
            console.log('Connected to game server')
        })
        this.gameSocket.on('connect_error', (err: Error) => {
            console.log('Connection error', err.message)
            this.onClose()
        })
        this.gameSocket.on('disconnect', () => {
            console.log('Disconnected from game server')
            this.onClose()
        })
        this.gameSocket.on(
            'game_handshake',
            (data: { game_id: string; battlefield: Battlefield; entities_info: BattlefieldEntitiesInformation }) => {
                console.log('Handshake', data)
                this.gameId = data.game_id
                const { battlefield, entities_info } = data
                this.gameState = {
                    round_count: 0,
                    messages: {},
                    battleResult: 'pending',
                    currentBattlefield: battlefield,
                    allEntitiesInfo: entities_info,
                    entityActions: null,
                    currentPlayer: null,
                    currentEntity: null,
                }
                this.sendToAllPlayers('game_handshake', {
                    game_id: this.gameId,
                })
            }
        )
        this.gameSocket.on('round_update', (data: { round_count: number }) => {
            console.log('Round updated', data)
            this.gameState.round_count = data.round_count
            this.sendToAllPlayers('round_update', { round_count: this.gameState.round_count })
        })
        this.gameSocket.on('state_updated', (data: { message: string; battlefield_updated: boolean }) => {
            console.log('State updated', data)
            const { message, battlefield_updated } = data
            if (message) {
                this.addNewMessage(message)
            }
            if (battlefield_updated) {
                this.updateBattlefield()
            }
        })
        this.gameSocket.on('battle_started', () => {
            console.log('Game has started')
            this.gameState.battleResult = 'ongoing'
            this.sendToAllPlayers('battle_started')
        })
        this.gameSocket.on('player_turn', (data: { user_token: string; entity_id: string }) => {
            console.log('Player turn', data)
            const { user_token, entity_id } = data
            this.gameState.currentPlayer = user_token
            this.gameState.currentEntity = entity_id
            if (this.players.has(user_token)) {
                this.sendToPlayer(user_token, 'take_action', {
                    user_token: user_token,
                    entity_id: entity_id,
                })
            } else {
                if (
                    !this.sendToGm('take_action', {
                        user_token: user_token,
                        entity_id: entity_id,
                    })
                ) {
                    this.sendToServer('player_choice', {
                        game_id: this.gameId,
                        user_token: user_token,
                        choices: {
                            action: 'builtins:skip',
                        },
                    })
                }
            }
        })
        this.gameSocket.on('action_result', (data: { user_token: string; code: number; message: string }) => {
            console.log('Action result', data)
            this.gameState.currentEntity = null
            this.gameState.currentPlayer = null
            this.sendToPlayer(data.user_token, 'action_result', {
                code: data.code,
                message: data.message,
            })
        })
        this.gameSocket.on(
            'battle_ended',
            (data: { battle_result: 'builtins:win' | 'builtins:lose' | 'builtins:draw' | 'builtins:flee' }) => {
                console.log('Game has ended', data)
                this.gameState.battleResult = data.battle_result
                this.sendToAllPlayers('battle_ended', data)
            }
        )
        this.gameSocket.on('error', (err: Error) => {
            console.log('Error from game server', err.message)
        })
        this.gameSocket.on('ping', () => {
            console.log('Ping received')
        })
        this.gameSocket.on('*', function (data: any) {
            console.log('Received', data)
        })
    }
}
