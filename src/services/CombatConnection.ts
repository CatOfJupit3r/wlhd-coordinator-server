import { Socket as PlayerSocket } from 'socket.io'
import io, { Socket } from 'socket.io-client'
import { DefaultEventsMap } from 'socket.io/dist/typed-events'
import { GAME_SECRET_TOKEN, GAME_SERVER_URL } from '../configs'
import {
    EntityInfoFull,
    EntityInfoTooltip,
    EntityInfoTurn,
    GameHandshake as GameHandshakePlayers,
} from '../models/ClientModels'
import {
    Battlefield,
    ControlInfo,
    EntityAction,
    EntityInfo,
    GameHandshake as GameHandshakeGameServer,
    GamePreset,
    GameStateContainer,
} from '../models/ServerModels'
import { TranslatableString } from '../models/Translation'

const GAME_SERVER_EVENTS = {
    GAME_HANDSHAKE: 'game_handshake',
    ROUND_UPDATE: 'round_update',
    BATTLE_STARTED: 'battle_started',
    PLAYER_TURN: 'player_turn',
    SKIP: 'skip',
    GAME_STATE: 'game_state',
    ACTION_RESULT: 'action_result',
    BATTLE_ENDED: 'battle_ended',
    NEW_MESSAGE: 'new_message',
    BATTLEFIELD_UPDATED: 'battlefield_updated',
    ENTITIES_UPDATED: 'entities_updated',
    PING: 'ping',
}

const PLAYER_EVENTS = {
    TAKE_ACTION: 'take_action',
    SKIP: 'skip',
    GAME_HANDSHAKE: 'game_handshake',
    REQUEST_DATA: 'request_data',
}

const GM_EVENTS = {
    ALLOCATE: 'allocate',
    START_COMBAT: 'start_combat',
    END_COMBAT: 'end_combat',
    TRY_SENDING_AGAIN: 'try_sending_again', // this event is for GM to try sending actions to original player again
}

const GAME_SERVER_RESPONSES = {
    PLAYER_CHOICE: 'player_choice',
    ALLOCATE: 'allocate',
    START_COMBAT: 'start_combat',
    END_COMBAT: 'end_combat',
    PONG: 'pong',
}

const PLAYER_RESPONSES = {
    BATTLE_STARTED: 'battle_started',
    ROUND_UPDATE: 'round_update',
    GAME_HANDSHAKE: 'game_handshake',
    ACTION_RESULT: 'action_result',
    BATTLE_ENDED: 'battle_ended',
    ENTITIES_UPDATED: 'entities_updated', // this response to give tooltips and full info (players) of entities
    CURRENT_ENTITY_UPDATED: 'current_entity_updated', // this response to give info about CURRENT ACTIVE entity
    NO_CURRENT_ENTITY: 'no_current_entity', // and this response to remove info about CURRENT ACTIVE entity, if there is
    HALT_ACTION: 'halt_action',
    TAKE_ACTION: 'take_action',
    NEW_MESSAGE: 'new_message',
    BATTLEFIELD_UPDATED: 'battlefield_updated',
    INCOMING_DATA: 'incoming_data',
}

const GM_RESPONSES = {
    TAKE_UNALLOCATED_ACTION: 'take_unallocated_action',
    // if player is not present, but GM is, then GM can take action and is notified about unallocated entity.
    TAKE_OFFLINE_PLAYER_ACTION: 'take_offline_player_action',
}

interface Player {
    socket: PlayerSocket | null
    id_: string
    isGm?: boolean
}

type GameSocket = Socket<DefaultEventsMap, DefaultEventsMap>

export class CombatConnection {
    public combatNickname: string
    private readonly combatPresets: GamePreset
    private readonly players: Array<Player>
    private readonly gameSocket: GameSocket
    private gameId: string
    private gameState: {
        roundCount: number
        messages: GameStateContainer
        battleResult: 'pending' | 'ongoing'
        currentBattlefield: Battlefield
        allEntitiesInfo: { [square: string]: EntityInfo | null } // info about all entities.
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
        this.gameSocket = io(GAME_SERVER_URL(), {
            path: '/sockets',
            autoConnect: false,
            reconnection: false,
            query: {
                token: GAME_SECRET_TOKEN(),
            },
        })
    }

    private setGameId(gameId: string) {
        console.log(`Connected to game server with id: ${gameId}`)
        this.gameId = gameId
    }

    public getRoundCount() {
        console.log('Current game state', this.gameState)
        return this.gameState?.roundCount || 0
    }

    public isActive() {
        return this.gameSocket.connected
    }

    public isPlayerInCombat(playerName: string): boolean {
        return this.players.some(
            (player) => player.id_ === playerName && player.socket !== null && player.socket.connected
        )
    }

    public connect() {
        /**
         * @throws {Error} if connection to game server fails
         */
        if (this.gameSocket.connected) {
            return
        }
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
        console.log('Sending event', event, 'to player', userToken)
        if (player && player.socket) {
            console.log('Player found and socket exists. Sending...')
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

    private onClose() {
        this.players.forEach((player) => {
            player.socket?.disconnect()
        })
        this.removeSelf()
    }

    private addNewMessage(newMessage: Array<TranslatableString>) {
        this.gameState.messages = [...this.gameState.messages, newMessage]
    }

    private updateBattlefield(newBattlefield: Battlefield) {
        this.gameState.currentBattlefield = newBattlefield
    }

    private updateRoundCount(newRoundCount: number) {
        this.gameState.roundCount = newRoundCount
    }

    private updateEntitiesInfo(newEntityData: { [square: string]: EntityInfo }) {
        this.gameState.allEntitiesInfo = {
            ...this.gameState.allEntitiesInfo,
            ...newEntityData,
        }
    }

    private updateEntityActions(actions: EntityAction) {
        if (!this.gameState.turn.entity) {
            return
        }
        this.gameState.turn.actions = actions
    }

    private sendActionsToServer(actions: { [key: string]: string }, player: Player) {
        if (this.gameState && (player.isGm || this.gameState.turn.player === player.id_)) {
            if (!('action' in actions)) {
                player.socket && player.socket.emit('error', 'No action specified!')
                return
            }
            this.broadcast(PLAYER_RESPONSES.HALT_ACTION) // we halt all actions in case some other socket decides to send actions
            this.sendToServer(GAME_SERVER_RESPONSES.PLAYER_CHOICE, {
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
            const event = packet[0]
            if (event === 'error') {
                console.log('Error from player', packet[1])
                next()
            } else if (
                (player.isGm && Object.values(GM_EVENTS).includes(event)) ||
                Object.values(PLAYER_EVENTS).includes(event)
            ) {
                if (
                    (this.gameState && this.gameState.battleResult === 'ongoing') ||
                    event === PLAYER_EVENTS.GAME_HANDSHAKE ||
                    event === GM_EVENTS.START_COMBAT
                ) {
                    next()
                } else {
                    playerSocket.emit('error', 'Game is not active!')
                }
            } else {
                console.log('Invalid event from player', event)
                playerSocket.emit('error', `Invalid event: ${event}`)
            }
        })
        playerSocket.onAny((event, ...args) => {
            console.log(`Received ${event} with args: ${args}`)
        })
        this.setupPlayerListeners(playerSocket, player)
        if (player.isGm) {
            this.setupGmListeners(playerSocket, player)
            if (!this.gameSocket.connected) {
                this.connect()
            }
        }
        this.players[this.players.indexOf(player)].socket = playerSocket
        this.gameSocket.connected &&
            (() => {
                this.players[this.players.indexOf(player)].socket?.emit(
                    PLAYER_RESPONSES.GAME_HANDSHAKE,
                    this.createHandshake(player.id_)
                )
                this.gameState.battleResult === 'ongoing' &&
                    this.gameState.turn.player === player.id_ &&
                    this.gameState.turn.entity &&
                    this.emitTakeActionToPlayer()
            })()
    }

    private setupGameListeners() {
        const LISTENERS = {
            [GAME_SERVER_EVENTS.GAME_HANDSHAKE]: (data: GameHandshakeGameServer) => {
                console.log('Handshake', data)
                const {
                    gameId,
                    roundCount,
                    currentBattlefield,
                    messages,
                    combatStatus,
                    entityActions,
                    currentEntity,
                    currentPlayer,
                    allEntitiesInfo,
                } = data
                this.setGameId(gameId)
                this.gameState = {
                    roundCount: roundCount,
                    messages: messages,
                    battleResult: combatStatus,
                    currentBattlefield: currentBattlefield,
                    allEntitiesInfo: allEntitiesInfo,
                    turn: {
                        actions: entityActions,
                        player: currentPlayer,
                        entity: currentEntity,
                    },
                }
                this.players.forEach((player) => {
                    if (player.socket) {
                        player.socket.emit(PLAYER_RESPONSES.GAME_HANDSHAKE, this.createHandshake(player.id_))
                    }
                })
            },
            [GAME_SERVER_EVENTS.ROUND_UPDATE]: (data: { round_count: number }) => {
                console.log('Round updated', data)
                this.updateRoundCount(data.round_count)
                this.broadcast(PLAYER_RESPONSES.ROUND_UPDATE, {
                    roundCount: this.gameState.roundCount,
                })
            },
            [GAME_SERVER_EVENTS.NEW_MESSAGE]: ({ message }: { message: Array<TranslatableString> }) => {
                console.log('New message', message)
                this.addNewMessage(message)
                this.broadcast(PLAYER_RESPONSES.NEW_MESSAGE, {
                    message: message,
                })
            },
            [GAME_SERVER_EVENTS.BATTLEFIELD_UPDATED]: (data: { battlefield: Battlefield }) => {
                console.log('Battlefield updated')
                this.updateBattlefield(data.battlefield)
                this.broadcast(PLAYER_RESPONSES.BATTLEFIELD_UPDATED, {
                    battlefield: this.gameState.currentBattlefield,
                })
            },
            [GAME_SERVER_EVENTS.ENTITIES_UPDATED]: (data: {
                newEntityData: {
                    [id: string]: EntityInfo
                }
            }) => {
                console.log('Entities updated')
                this.updateEntitiesInfo(data.newEntityData)
                // instead of broadcasting, we send info individually, because of 'controlledEntities' data
                for (const player of this.players) {
                    if (player.socket) {
                        player.socket.emit(PLAYER_RESPONSES.ENTITIES_UPDATED, {
                            newControlledEntities: this.generateEntityFullInfoForPlayer(player.id_),
                            newTooltips: this.generateEntityToolTipForPlayer(),
                        })
                    }
                }
            },
            [GAME_SERVER_EVENTS.BATTLE_STARTED]: () => {
                console.log('Game has started')
                this.gameState.battleResult = 'ongoing'
                this.broadcast(PLAYER_RESPONSES.BATTLE_STARTED)
            },
            [GAME_SERVER_EVENTS.PLAYER_TURN]: async ({
                user_token,
                entity_id,
                actions,
            }: {
                user_token: string
                entity_id: string
                actions: EntityAction
            }) => {
                try {
                    this.gameState.turn.player = user_token
                    this.gameState.turn.entity = entity_id
                    const entityInfo = this.findEntityInfoById(entity_id)
                    entityInfo &&
                        this.broadcast(PLAYER_RESPONSES.CURRENT_ENTITY_UPDATED, {
                            activeEntity: this.generateEntityTurnInfo(entityInfo),
                        })
                    this.updateEntityActions(actions)
                    this.emitTakeActionToPlayer()
                } catch (e) {
                    console.log('Error handling take action listener ', e)
                    this.sendToServer(GAME_SERVER_RESPONSES.PLAYER_CHOICE, {
                        game_id: this.gameId,
                        user_token: user_token,
                        choices: {
                            action: 'builtins:skip',
                        },
                    })
                }
            },
            [GAME_SERVER_EVENTS.ACTION_RESULT]: (data: {
                user_token: string
                code: number
                message: 'builtins:action_performed' | 'builtins:invalid_input' | string
            }) => {
                console.log('Action result', data)
                this.gameState.turn.player = null
                this.gameState.turn.entity = null
                this.broadcast(PLAYER_RESPONSES.NO_CURRENT_ENTITY)

                this.sendToPlayer(data.user_token, PLAYER_RESPONSES.ACTION_RESULT, {
                    code: data.code,
                    message: data.message,
                })
            },
            [GAME_SERVER_EVENTS.BATTLE_ENDED]: (data: {
                battle_result:
                    | 'builtins:win'
                    | 'builtins:lose'
                    | 'builtins:draw'
                    | 'builtins:flee'
                    | 'builtins:terminated'
            }) => {
                console.log('Game has ended', data)
                this.broadcast(PLAYER_RESPONSES.BATTLE_ENDED, data)
                this.onClose()
            },
            [GAME_SERVER_EVENTS.PING]: () => {
                this.sendToServer(GAME_SERVER_RESPONSES.PONG)
            },
            connect: () => {
                console.log('Connected to game server. Preparing handshake')
                this.sendToServer('game_handshake', {
                    game_preset: this.combatPresets,
                })
            },
            error: (err: Error) => {
                console.log('Error from game server', err)
            },
            disconnect: () => {
                console.log('Disconnected from game server')
                this.onClose()
            },
        }

        this.addBatchOfEventsListener(this.gameSocket, LISTENERS)
    }

    private setupPlayerListeners(playerSocket: PlayerSocket, player: Player) {
        const LISTENERS = {
            [PLAYER_EVENTS.TAKE_ACTION]: (data: { action: string; [action_vars: string]: string }) => {
                this.sendActionsToServer(data, player)
            },
            [PLAYER_EVENTS.SKIP]: () => {
                this.sendActionsToServer({ action: 'builtins:skip' }, player)
            },
            [PLAYER_EVENTS.REQUEST_DATA]: ({
                type,
                payload,
            }:
                | {
                      type: 'messages'
                      payload?: { start: number; end: number } // if there is no payload, then we send last 10 messages
                  }
                | {
                      type: 'current_entity_info'
                      payload: null
                  }
                | {
                      type: 'entity_tooltip'
                      payload: { square: { line: string; column: string } }
                  }
                | {
                      type: 'controlled_entities'
                      payload: null
                  }
                | {
                      type: 'battlefield'
                      payload: null
                  }) => {
                switch (type) {
                    case 'messages':
                        player.socket?.emit(PLAYER_RESPONSES.INCOMING_DATA, {
                            type: 'messages',
                            payload: {
                                messages: () => {
                                    const { start, end } = payload || { start: -10, end: 0 }
                                    return this.gameState.messages.slice(start, end)
                                },
                            },
                        })
                        break
                    case 'current_entity_info':
                        if (this.gameState.turn.entity) {
                            player.socket?.emit(PLAYER_RESPONSES.INCOMING_DATA, {
                                type: 'current_entity_info',
                                payload: {
                                    entity: (() => {
                                        const entityInfo = this.findEntityInfoById(this.gameState.turn.entity)
                                        return entityInfo ? this.generateEntityFullInfo(entityInfo) : null
                                    })(),
                                },
                            })
                        } else {
                            player.socket?.emit(PLAYER_RESPONSES.INCOMING_DATA, {
                                type: 'current_entity_info',
                                payload: {
                                    entity: null,
                                },
                            })
                        }
                        break
                    case 'entity_tooltip': {
                        const { square } = payload
                        const entity = Object.values(this.gameState.allEntitiesInfo).find(
                            (entity) =>
                                entity && entity.square.line === square.line && entity.square.column === square.column
                        )
                        if (entity) {
                            player.socket?.emit(PLAYER_RESPONSES.INCOMING_DATA, {
                                type: 'entity_tooltip',
                                payload: {
                                    entity: this.generateEntityToolTip(entity),
                                },
                            })
                        } else {
                            player.socket?.emit(PLAYER_RESPONSES.INCOMING_DATA, {
                                type: 'entity_tooltip',
                                payload: {
                                    entity: null,
                                },
                            })
                        }
                        break
                    }
                    case 'controlled_entities':
                        player.socket?.emit(PLAYER_RESPONSES.INCOMING_DATA, {
                            type: 'controlled_entities',
                            payload: {
                                newControlledEntities: this.generateEntityFullInfoForPlayer(player.id_),
                            },
                        })
                        break
                    case 'battlefield':
                        player.socket?.emit(PLAYER_RESPONSES.INCOMING_DATA, {
                            type: 'battlefield',
                            payload: {
                                battlefield: this.gameState.currentBattlefield,
                            },
                        })
                        break
                    default:
                        player.socket?.emit(PLAYER_RESPONSES.INCOMING_DATA, {
                            type: 'invalid',
                            payload: {
                                request: {
                                    type: type,
                                    payload: payload,
                                },
                            },
                        })
                        break
                }
            },
        }
        this.addBatchOfEventsListener(playerSocket, LISTENERS)
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
                this.broadcast(PLAYER_RESPONSES.HALT_ACTION)
                this.sendToServer(GAME_SERVER_RESPONSES.ALLOCATE, {
                    game_id: this.gameId,
                    allocation: {
                        filter,
                        allocation,
                    },
                })
            },
            [GM_EVENTS.START_COMBAT]: () => {
                this.sendToServer(GAME_SERVER_RESPONSES.START_COMBAT)
            },
            [GM_EVENTS.END_COMBAT]: () => {
                this.broadcast(PLAYER_RESPONSES.HALT_ACTION)
                this.sendToServer(GAME_SERVER_RESPONSES.END_COMBAT)
            },
        }
        this.addBatchOfEventsListener(playerSocket, GM_LISTENERS)
    }

    private addBatchOfEventsListener(
        socket: PlayerSocket | GameSocket,
        listeners: {
            [key: string]: (...args: any[]) => void
        }
    ) {
        if (socket instanceof PlayerSocket) {
            for (const [event, callback] of Object.entries(listeners)) {
                socket.removeListener(event, callback)
                socket.on(event, callback)
            }
        } else {
            for (const [event, callback] of Object.entries(listeners)) {
                socket.off(event)
                socket.on(event, callback)
            }
        }
    }

    private generateEntityToolTip(entity: EntityInfo): EntityInfoTooltip {
        return {
            decorations: entity.decorations,
            square: { line: entity.square.line, column: entity.square.column },
            health: {
                current: entity.attributes['builtins:current_health'],
                max: entity.attributes['builtins:max_health'],
            },
            action_points: {
                current: entity.attributes['builtins:current_action_points'],
                max: entity.attributes['builtins:max_action_points'],
            },
            armor: {
                current: entity.attributes['builtins:current_armor'],
                base: entity.attributes['builtins:base_armor'],
            },
            status_effects: entity.status_effects.map((effect) => {
                return {
                    decorations: effect.decorations,
                    duration: effect.duration ? effect.duration.toString() : null,
                }
            }),
        }
    }

    private generateEntityFullInfo(entity: EntityInfo): EntityInfoFull {
        const {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            controlled_by,
            items,
            weapons,
            spells,
            ...entityInfo
        } = entity
        return {
            ...entityInfo,
            inventory: items,
            weaponry: weapons,
            spell_book: spells,
        }
    }

    private generateEntityTurnInfo(entity: EntityInfo): EntityInfoTurn {
        return {
            decorations: entity.decorations,
            square: { line: entity.square.line.toString(), column: entity.square.column.toString() },
            action_points: {
                current: entity.attributes['builtins:current_action_points'] || '0',
                max: entity.attributes['builtins:max_action_points'] || '0',
            },
        }
    }

    private generateEntityFullInfoForPlayer(playerId: string): Array<EntityInfoFull> {
        const res: Array<EntityInfoFull> = []
        Object.values(this.gameState.allEntitiesInfo).forEach((entity) => {
            if (entity && entity.controlled_by.type === 'player' && entity.controlled_by.id === playerId) {
                res.push(this.generateEntityFullInfo(entity))
            }
        })
        return res
    }

    private generateEntityToolTipForPlayer(): { [square: string]: EntityInfoTooltip | null } {
        return Object.entries(this.gameState.allEntitiesInfo).reduce((acc, [, entity]) => {
            if (!entity) return acc
            return {
                ...acc,
                [`${entity.square.line}/${entity.square.column}`]: this.generateEntityToolTip(entity),
            }
        }, {})
    }

    private findEntityInfoById(id: string): EntityInfo | null {
        return Object.values(this.gameState.allEntitiesInfo).find((entity) => entity && entity.id === id) || null
    }

    private createHandshake(playerId: string): GameHandshakePlayers {
        return {
            roundCount: this.gameState.roundCount,
            messages: this.gameState.messages.slice(-10),
            combatStatus: this.gameState.battleResult,
            currentBattlefield: this.gameState.currentBattlefield,
            currentEntityInfo: (() => {
                if (this.gameState.turn.entity) {
                    const entityInfo = this.findEntityInfoById(this.gameState.turn.entity)
                    return entityInfo ? this.generateEntityTurnInfo(entityInfo) : null
                } else {
                    return null
                }
            })(),
            entityTooltips: this.generateEntityToolTipForPlayer(),
            controlledEntities: this.generateEntityFullInfoForPlayer(playerId),
        }
    }

    private emitTakeActionToPlayer() {
        const trySending = (user_token: string | null, entity_id: string): boolean => {
            if (!user_token) {
                return this.sendToGm(GM_RESPONSES.TAKE_UNALLOCATED_ACTION, {
                    entityId: entity_id,
                    actions: this.gameState.turn.actions,
                })
            }
            if (user_token && this.players.find((player) => player.id_ === user_token)) {
                this.sendToPlayer(user_token, PLAYER_RESPONSES.TAKE_ACTION, {
                    entityId: entity_id,
                    actions: this.gameState.turn.actions,
                })
                return true
            } else {
                return this.sendToGm(GM_RESPONSES.TAKE_OFFLINE_PLAYER_ACTION, {
                    entityId: entity_id,
                    actions: this.gameState.turn.actions,
                })
            }
        }
        const { player, entity } = this.gameState.turn
        if (entity && !trySending(player, entity)) {
            setTimeout(() => {
                if (!trySending(player, entity)) {
                    this.sendToServer(GAME_SERVER_RESPONSES.PLAYER_CHOICE, {
                        game_id: this.gameId,
                        user_token: player,
                        choices: {
                            action: 'builtins:skip',
                        },
                    })
                }
            }, 1000)
        }
    }

    public getActivePlayers(): Array<string> {
        return this.players.filter((player) => player.socket?.connected).map((player) => player.id_)
    }
}
