import { Socket as PlayerSocket } from 'socket.io'
import io, { Socket } from 'socket.io-client'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'
import { GAME_SERVER_URL, SECRET_TOKEN } from '../configs/config'

import {
    Battlefield,
    ControlInfo,
    EntityAction,
    EntityInfo,
    GamePreset,
    GameStateContainer,
} from '../models/ServerModels'
import GameAPIService from './GameAPIService'

const GAME_SERVER_EVENTS = {
    GAME_HANDSHAKE: 'game_handshake',
    ROUND_UPDATE: 'round_update',
    BATTLE_STARTED: 'battle_started',
    TAKE_ACTION: 'take_action',
    SKIP: 'skip',
    GAME_STATE: 'game_state',
    ACTION_RESULT: 'action_result',
    BATTLE_ENDED: 'battle_ended',
}

const PLAYER_EVENTS = {
    TAKE_ACTION: 'take_action',
    SKIP: 'skip',
}

const GM_EVENTS = {
    ALLOCATE: 'allocate',
    START_COMBAT: 'start_combat',
    END_COMBAT: 'end_combat',
}

const RESPONSE_EVENTS = {
    PLAYER_CHOICE: 'player_choice',
    NEW_MESSAGE: 'new_message',
    BATTLEFIELD_UPDATE: 'battlefield_update',
    ALLOCATE: 'allocate',
    HALT_ACTION: 'halt_action',
    START_COMBAT: 'start_combat',
    END_COMBAT: 'end_combat',
    CURRENT_ENTITY_UPDATED: 'current_entity_updated',
    NO_CURRENT_ENTITY: 'no_current_entity',
    TAKE_ACTION: 'take_action',
}

type Player = {
    socket: PlayerSocket | null
    id_: string
    isGm?: boolean
}

export class CombatConnection {
    public combatNickname: string
    private readonly combatPresets: GamePreset
    private players: Array<Player>
    private gameSocket: Socket<DefaultEventsMap, DefaultEventsMap>
    private gameId: string
    private gameState: {
        round_count: number
        messages: GameStateContainer
        battleResult: 'pending' | 'ongoing'
        currentBattlefield: Battlefield
        allEntitiesInfo: Array<EntityInfo> // info about all entities.
        turn: {
            actions: EntityAction | null // keeps json of possible entity action in order to not fetch them each event
            player: string | null // handle of current player. Supplied by game servers
            entity: string | null // entity_id of current. Supplied by game servers
        }
    }
    private readonly gmId: string
    private readonly removeSelf: () => void

    constructor(
        combatNickname: string,
        combatPreset: GamePreset,
        removeSelf: () => void,
        gmId: string,
        players: Array<string>
    ) {
        this.combatNickname = combatNickname
        this.combatPresets = combatPreset
        this.gmId = gmId
        this.players = []
        players.forEach((player) => {
            this.players.push({
                socket: null,
                id_: player,
                isGm: player === this.gmId,
            })
        })
        this.removeSelf = removeSelf
        this.gameSocket = io(GAME_SERVER_URL, {
            path: '/sockets',
            autoConnect: false,
            query: {
                token: SECRET_TOKEN,
            },
        })
    }

    public getRoundCount() {
        return this.gameState.round_count
    }

    public isActive() {
        return this.gameSocket.active
    }

    public isPlayerInCombat(playerName: string): boolean {
        return this.players.some((player) => player.id_ === playerName)
    }

    public connect() {
        /**
         * @throws {Error} if connection to game server fails
         */
        this.setupGameListeners()
        this.gameSocket.connect()
    }

    private broadcast(event: string, payload?: object) {
        this.players.forEach((player) => {
            const { socket } = player
            if (socket && socket) {
                payload ? socket.emit(event, payload) : socket.emit(event)
            }
        })
    }

    private sendToPlayer(userToken: string, event: string, payload?: object) {
        const player = this.players.find((player) => player.id_ === userToken)
        if (player && player.socket) {
            payload ? player.socket.emit(event, payload) : player.socket.emit(event)
        }
    }

    private sendToGm(event: string, payload?: object): boolean {
        const gm = this.players.find((player) => player.isGm)
        if (gm && gm.socket) {
            payload ? gm.socket.emit(event, payload) : gm.socket.emit(event)
            return true
        } else return false
    }

    private sendToServer(event: string, payload?: object) {
        if (this.gameSocket.connected) {
            this.gameSocket.emit(event, payload)
        } else {
            console.log('Game server not connected')
        }
    }

    private onClose(message: string = 'Game server connection closed') {
        console.log(message)
        this.players.forEach((player) => {
            player.socket?.disconnect()
        })
        this.removeSelf()
    }

    private addNewMessage(message: string) {
        GameAPIService.fetchMessage(this.gameId, message)
            .then((data) => {
                this.gameState.messages = [...this.gameState.messages, ...data]
                this.broadcast(RESPONSE_EVENTS.NEW_MESSAGE, {
                    message: data,
                })
            })
            .catch((e) => {
                console.log('Error fetching message', e.message)
            })
    }

    private updateBattlefield() {
        GameAPIService.fetchBattlefield(this.gameId)
            .then((data) => {
                this.gameState.currentBattlefield = data
                this.broadcast(RESPONSE_EVENTS.BATTLEFIELD_UPDATE, {
                    battlefield: data,
                })
            })
            .catch((e) => {
                console.log('Error fetching battlefield', e.message)
            })
    }

    private updateEntitiesInfo() {
        GameAPIService.fetchAllEntityInfo(this.gameId)
            .then((data) => {
                this.gameState.allEntitiesInfo = data
            })
            .catch((e) => {
                console.log('Error fetching entities info', e.message)
            })
    }

    private async updateEntityActions() {
        if (!this.gameState.turn.entity) {
            return
        }
        this.gameState.turn.actions = await GameAPIService.fetchEntityActions(this.gameId, this.gameState.turn.entity)
    }

    private sendActionsToServer(actions: { [key: string]: string }, player: Player) {
        if (this.gameState && (player.isGm || this.gameState.turn.player === player.id_)) {
            if (!('action' in actions)) {
                player.socket && player.socket.emit('error', 'No action specified!')
                return
            }
            this.broadcast(RESPONSE_EVENTS.HALT_ACTION) // we halt all actions in case some other socket decides to send actions
            this.sendToServer(RESPONSE_EVENTS.PLAYER_CHOICE, {
                game_id: this.gameId,
                user_token: player.id_,
                choices: {
                    ...actions,
                },
            })
        } else {
            player.socket && player.socket.emit('error', 'Not your turn!')
        }
    }

    public handlePlayer(userToken: string, playerSocket: PlayerSocket) {
        const player = this.players.find((player) => player.id_ === userToken)
        if (!player) {
            console.log('Player not found')
            playerSocket.disconnect()
            return
        }
        console.log('Player connected', userToken)

        playerSocket.use((packet, next) => {
            if (packet[0] === 'error') {
                console.log('Error from player', packet[1])
            } else if (packet[0] in PLAYER_EVENTS) {
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
        playerSocket.onAny((event, ...args) => {
            console.log(`Received ${event} with args: ${args}`)
        })
        this.setupPlayerListeners(playerSocket, player)
        if (player.isGm) {
            this.setupGmListeners(playerSocket, player)
        }
        this.players[this.players.indexOf(player)].socket = playerSocket
    }

    private setupGameListeners() {
        const LISTENERS = {
            [GAME_SERVER_EVENTS.GAME_HANDSHAKE]: (data: {
                game_id: string
                battlefield: Battlefield
                entities_info: Array<EntityInfo>
            }) => {
                console.log('Handshake', data)
                this.gameId = data.game_id
                const { battlefield, entities_info } = data
                this.gameState = {
                    round_count: 0,
                    messages: [],
                    battleResult: 'pending',
                    currentBattlefield: battlefield,
                    allEntitiesInfo: entities_info,
                    turn: {
                        actions: null,
                        player: null,
                        entity: null,
                    },
                }
                this.broadcast(GAME_SERVER_EVENTS.GAME_HANDSHAKE, {
                    game_id: this.gameId,
                })
            },
            [GAME_SERVER_EVENTS.ROUND_UPDATE]: (data: { round_count: number }) => {
                console.log('Round updated', data)
                this.gameState.round_count = data.round_count
                this.broadcast(GAME_SERVER_EVENTS.ROUND_UPDATE, { round_count: this.gameState.round_count })
            },
            [GAME_SERVER_EVENTS.GAME_STATE]: (data: { message: string; battlefield_updated: boolean }) => {
                console.log('State updated', data)
                const { message, battlefield_updated } = data
                if (message || battlefield_updated) {
                    this.updateEntitiesInfo()
                    if (message) {
                        this.addNewMessage(message)
                    }
                    if (battlefield_updated) {
                        this.updateBattlefield()
                    }
                }
            },
            [GAME_SERVER_EVENTS.BATTLE_STARTED]: () => {
                console.log('Game has started')
                this.gameState.battleResult = 'ongoing'
                this.broadcast(GAME_SERVER_EVENTS.BATTLE_STARTED)
            },
            [GAME_SERVER_EVENTS.TAKE_ACTION]: async (data: { user_token: string; entity_id: string }) => {
                console.log('Player turn', data)
                const { user_token, entity_id } = data
                this.gameState.turn.player = user_token
                this.gameState.turn.entity = entity_id
                this.broadcast(RESPONSE_EVENTS.CURRENT_ENTITY_UPDATED)

                try {
                    await this.updateEntityActions()
                } catch (e) {
                    console.log('Error fetching entity actions', e)
                    this.sendToServer(RESPONSE_EVENTS.PLAYER_CHOICE, {
                        game_id: this.gameId,
                        user_token: user_token,
                        choices: {
                            action: 'builtins:skip',
                        },
                    })
                }

                const trySending = (user_token: string, entity_id: string): boolean => {
                    if (user_token && this.players.find((player) => player.id_ === user_token)) {
                        this.sendToPlayer(user_token, RESPONSE_EVENTS.TAKE_ACTION, {
                            entity_id: entity_id,
                        })
                        return true
                    } else {
                        return this.sendToGm(RESPONSE_EVENTS.TAKE_ACTION, {
                            entity_id: entity_id,
                        })
                    }
                }
                if (!trySending(user_token, entity_id)) {
                    setTimeout(() => {
                        if (!trySending(user_token, entity_id)) {
                            this.sendToServer(RESPONSE_EVENTS.PLAYER_CHOICE, {
                                game_id: this.gameId,
                                user_token: user_token,
                                choices: {
                                    action: 'builtins:skip',
                                },
                            })
                        }
                    }, 1000)
                }
            },
            [GAME_SERVER_EVENTS.ACTION_RESULT]: (data: { user_token: string; code: number; message: string }) => {
                console.log('Action result', data)
                this.gameState.turn.player = null
                this.gameState.turn.entity = null
                this.broadcast(RESPONSE_EVENTS.NO_CURRENT_ENTITY, data)

                this.sendToPlayer(data.user_token, GAME_SERVER_EVENTS.ACTION_RESULT, {
                    code: data.code,
                    message: data.message,
                })
            },
            [GAME_SERVER_EVENTS.BATTLE_ENDED]: (data: {
                battle_result: 'builtins:win' | 'builtins:lose' | 'builtins:draw' | 'builtins:flee'
            }) => {
                console.log('Game has ended', data)
                this.broadcast(GAME_SERVER_EVENTS.BATTLE_ENDED, data)
                this.onClose('Game has ended')
            },
            connect: () => {
                console.log('Connected to game server. Preparing handshake')
                this.sendToServer('game_handshake', {
                    game_preset: this.combatPresets,
                })
            },
            error: (err: Error) => {
                console.log('Error from game server', err.message)
            },
            disconnect: () => {
                this.onClose('Disconnected from game server')
            },
        }

        for (const event in LISTENERS) {
            this.gameSocket.on(event, LISTENERS[event])
        }
    }

    private setupPlayerListeners(playerSocket: PlayerSocket, player: Player) {
        const LISTENERS = {
            [PLAYER_EVENTS.TAKE_ACTION]: (data: { action: string; [action_vars: string]: string }) => {
                this.sendActionsToServer(data, player)
            },
            [PLAYER_EVENTS.SKIP]: () => {
                this.sendActionsToServer({ action: 'builtins:skip' }, player)
            },
        }
        for (const event in LISTENERS) {
            playerSocket.on(event, LISTENERS[event])
        }
    }

    private setupGmListeners(playerSocket: PlayerSocket, player: Player) {
        const GM_LISTENERS = {
            [GM_EVENTS.ALLOCATE]: ({
                filter,
                allocation,
            }: {
                filter: { type: 'square' | 'id'; value: string } | { type: 'current' }
                allocation: ControlInfo
            }) => {
                // this listener is for GM to allocate entity to player in case id of control info is null
                this.broadcast(RESPONSE_EVENTS.HALT_ACTION)
                this.sendToServer(RESPONSE_EVENTS.ALLOCATE, {
                    game_id: this.gameId,
                    allocation: {
                        filter,
                        allocation,
                    },
                })
            },
            [GM_EVENTS.START_COMBAT]: () => {
                this.sendToServer(RESPONSE_EVENTS.START_COMBAT)
            },
            [GM_EVENTS.END_COMBAT]: () => {
                this.broadcast(RESPONSE_EVENTS.HALT_ACTION)
                this.sendToServer(RESPONSE_EVENTS.END_COMBAT)
            },
        }
        for (const event in GM_LISTENERS) {
            playerSocket.on(event, GM_LISTENERS[event])
        }
    }
}
