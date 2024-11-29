import { GAME_SECRET_TOKEN, GAME_SERVER_URL } from '@config/env'
import {
    BattlefieldPlayers,
    CharacterInTurnOrder,
    EntityInfoFull,
    EntityInfoTooltip,
    GameHandshake as GameHandshakePlayers,
    iGameLobbyState,
    IndividualTurnOrder,
} from '@models/ClientModels'
import { ControlInfo } from '@models/GameSaveModels'
import GameState from '@models/GameState'
import {
    Battlefield,
    EntityInfo,
    GameHandshake as GameHandshakeGameServer,
    iCharacterAction,
} from '@models/ServerModels'
import { TranslatableString } from '@models/Translation'
import { CombatSaveType } from '@schemas/CombatSaveSchema'
import { iPlayer, Player } from '@services/CombatConnection/PlayerInGame'
import { DefaultEventsMap, Socket as PlayerSocket } from 'socket.io'
import io, { Socket } from 'socket.io-client'

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
    TURN_ORDER_UPDATED: 'turn_order_updated',
    PING: 'ping',
}

const PLAYER_EVENTS = {
    TAKE_ACTION: 'take_action',
    SKIP: 'skip',
    GAME_HANDSHAKE: 'game_handshake',
    REQUEST_DATA: 'request_data',
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
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
    NO_CURRENT_ENTITY: 'no_current_entity', // and this response to remove info about CURRENT ACTIVE entity, if there is
    HALT_ACTION: 'halt_action',
    TAKE_ACTION: 'take_action',
    NEW_MESSAGE: 'new_message',
    BATTLEFIELD_UPDATED: 'battlefield_updated',
    TURN_ORDER_UPDATED: 'turn_order_updated',
    INCOMING_DATA: 'incoming_data',
    GAME_LOBBY_STATE: 'game_lobby_state',
    ERROR: 'error',
    ACTION_TIMESTAMP: 'action_timestamp',
}

const GM_RESPONSES = {
    TAKE_UNALLOCATED_ACTION: 'take_unallocated_action',
    // if player is not present, but GM is, then GM can take action and is notified about unallocated entity.
    TAKE_OFFLINE_PLAYER_ACTION: 'take_offline_player_action',
}

type GameSocketType = Socket<DefaultEventsMap, DefaultEventsMap>

export class CombatConnection {
    public nickname: string
    private readonly initialSave: CombatSaveType
    private readonly players: Array<iPlayer>
    private readonly gameSocket: GameSocketType
    private gameId: string

    private readonly gameState: GameState
    private readonly gmId: string
    private readonly removeSelf: () => void

    constructor(nickname: string, save: CombatSaveType, removeSelf: () => void, gmId: string, players: Array<string>) {
        this.nickname = nickname
        this.initialSave = save
        this.gmId = gmId
        this.players = []
        this.gameState = new GameState()
        players.forEach((player) => {
            this.players.push(new Player(null, player, { getGmId: () => this.gmId }))
        })
        this.removeSelf = removeSelf
        this.gameSocket = io(GAME_SERVER_URL, {
            path: '/sockets',
            autoConnect: false,
            reconnection: false,
            query: {
                token: GAME_SECRET_TOKEN,
            },
        })
    }

    private setGameId(gameId: string) {
        console.log(`Connected to game server with id: ${gameId}`)
        this.gameId = gameId
    }

    public getRoundCount() {
        return this.gameState.getRoundCount()
    }

    public isActive() {
        return this.gameSocket.connected
    }

    public isPlayerInCombat(playerName: string): boolean {
        return this.players.some((player) => player.id === playerName && player.isConnected())
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
            player.emit(event, payload)
        })
    }

    private sendToPlayer(userToken: string, event: string, payload?: object) {
        const player = this.players.find((player) => player.id === userToken)
        console.log('Sending event', event, 'to player', userToken)
        player?.emit(event, payload, () => {
            console.log('Player found and socket exists. Event sent')
        })
    }

    private sendToGm(event: string, payload?: object): boolean {
        const gm = this.players.find((player) => player.isGm())
        if (gm && gm.isConnected()) {
            gm.emit(event, payload)
            return true
        } else return false
    }

    private isConnectedToGameServer(): boolean {
        return this.gameSocket.connected
    }

    private sendToServer(event: string, payload?: object) {
        if (this.isConnectedToGameServer()) {
            this.gameSocket.emit(event, payload)
        } else {
            console.log('Game server not connected')
        }
    }

    private onClose() {
        this.players.forEach((player) => {
            player.disconnect()
        })
        this.removeSelf()
    }

    private sendActionsToServer(actions: { [key: string]: string }, player: iPlayer) {
        if (this.gameState && (player.isGm() || this.gameState.isPlayerIdTurn(player.id))) {
            if (!('action' in actions)) {
                player.emit(PLAYER_RESPONSES.ERROR, 'No action specified!')
                return
            }
            this.broadcast(PLAYER_RESPONSES.HALT_ACTION) // we halt all actions in case some other socket decides to send actions
            this.sendToServer(GAME_SERVER_RESPONSES.PLAYER_CHOICE, {
                game_id: this.gameId,
                user_token: player.id,
                choices: {
                    ...actions,
                },
            })
        } else {
            player.emit(PLAYER_RESPONSES.ERROR, 'Not your turn!')
        }
    }

    public handlePlayer(userToken: string, playerSocket: PlayerSocket) {
        const player = this.players.find((player) => player.id === userToken)
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
                (player.isGm() && Object.values(GM_EVENTS).includes(event)) ||
                Object.values(PLAYER_EVENTS).includes(event)
            ) {
                if (
                    this.gameState.isOngoing() ||
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
        if (player.isGm()) {
            this.setupGmListeners(playerSocket, player)
            if (!this.gameSocket.connected) {
                this.connect()
            }
        }
        this.players[this.players.indexOf(player)].setSocket(playerSocket)
        this.broadcastGameLobbyStateUpdate()
        if (this.gameSocket.connected) {
            this.players[this.players.indexOf(player)].emit(
                PLAYER_RESPONSES.GAME_HANDSHAKE,
                this.createHandshake(player.id)
            )
            if (this.gameState.isPlayersTurn(player)) {
                this.emitTakeActionToPlayer()
            }
        }
    }

    private setupGameListeners() {
        const LISTENERS = {
            [GAME_SERVER_EVENTS.GAME_HANDSHAKE]: (data: GameHandshakeGameServer) => {
                console.log('Handshake', data)
                const { gameId } = data
                this.setGameId(gameId)

                this.gameState.fromHandshake(data)
                this.players.forEach((player) => {
                    player.emit(PLAYER_RESPONSES.GAME_HANDSHAKE, this.createHandshake(player.id))
                })
            },
            [GAME_SERVER_EVENTS.ROUND_UPDATE]: (data: { round_count: number }) => {
                console.log('Round updated', data)
                this.gameState.updateRoundCount(data.round_count)
                this.broadcast(PLAYER_RESPONSES.ROUND_UPDATE, {
                    roundCount: this.gameState.roundCount,
                })
            },
            [GAME_SERVER_EVENTS.NEW_MESSAGE]: ({ message }: { message: Array<TranslatableString> }) => {
                console.log('New message', message)
                this.gameState.addNewMessage(message)
                this.broadcast(PLAYER_RESPONSES.NEW_MESSAGE, {
                    message: message,
                })
            },
            [GAME_SERVER_EVENTS.BATTLEFIELD_UPDATED]: (data: { battlefield: Battlefield }) => {
                console.log('Battlefield updated')
                this.gameState.updateBattlefield(data.battlefield)
                this.broadcast(PLAYER_RESPONSES.BATTLEFIELD_UPDATED, {
                    battlefield: this.generateBattlefieldPlayers(),
                })
            },
            [GAME_SERVER_EVENTS.ENTITIES_UPDATED]: (data: {
                newEntityData: {
                    [id: string]: EntityInfo
                }
            }) => {
                console.log('Entities updated')
                this.gameState.updateEntitiesInfo(data.newEntityData)
                // instead of broadcasting, we send info individually, because of 'controlledEntities' data
                for (const player of this.players) {
                    player.emit(PLAYER_RESPONSES.ENTITIES_UPDATED, {
                        newControlledEntities: this.generateEntityFullInfoForPlayer(player.id),
                        // tooltips are sent in battlefield, duh
                    })
                }
            },
            [GAME_SERVER_EVENTS.BATTLE_STARTED]: () => {
                console.log('Game has started')
                this.gameState.setBattleResult('ongoing')
                this.broadcast(PLAYER_RESPONSES.BATTLE_STARTED)
            },
            [GAME_SERVER_EVENTS.PLAYER_TURN]: async ({
                user_token,
                entity_id,
                actions,
            }: {
                user_token: string
                entity_id: string
                actions: iCharacterAction
            }) => {
                try {
                    this.gameState.turnInfo.playerId = user_token
                    if (this.gameState.currentCharacterId() !== entity_id) {
                        this.gameState.setCurrentCharacterId(entity_id)
                        this.sendOutTurnOrderToPlayers()
                    }
                    this.gameState.updateTimeStamp()
                    this.sendActionTimeStampsToPlayers()
                    this.gameState.updateEntityActions(actions)
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
                this.gameState.resetTurnInfo()
                this.sendActionTimeStampsToPlayers()
                this.sendToPlayer(data.user_token, PLAYER_RESPONSES.ACTION_RESULT, {
                    code: data.code,
                    message: data.message,
                })
            },
            [GAME_SERVER_EVENTS.TURN_ORDER_UPDATED]: (data: { turn_queue: Array<string> }) => {
                console.log('Turn order updated', data)
                this.gameState.setTurnOrder(data.turn_queue)

                this.sendOutTurnOrderToPlayers()
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
                    game_save: this.initialSave,
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

    private setupPlayerListeners(playerSocket: PlayerSocket, player: iPlayer) {
        const LISTENERS = {
            [PLAYER_EVENTS.CONNECT]: () => {
                this.broadcastGameLobbyStateUpdate()
                console.log('Player connected', player.id)
            },
            [PLAYER_EVENTS.DISCONNECT]: () => {
                console.log('Player disconnected', player.id)
                this.players[this.players.indexOf(player)].resetSocket()
                this.broadcastGameLobbyStateUpdate()
            },
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
                      payload: { square: { line: number; column: number } }
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
                        player.emit(PLAYER_RESPONSES.INCOMING_DATA, {
                            type: 'messages',
                            payload: {
                                messages: () => {
                                    const { start, end } = payload || { start: -10, end: 0 }
                                    return this.gameState.messages.slice(start, end)
                                },
                            },
                        })
                        break
                    case 'current_entity_info': {
                        const currentCharacter = this.gameState.currentCharacterId()
                        if (currentCharacter !== null) {
                            player.emit(PLAYER_RESPONSES.INCOMING_DATA, {
                                type: 'current_entity_info',
                                payload: {
                                    entity: (() => {
                                        const entityInfo = this.gameState.getCharacterById(currentCharacter)
                                        return entityInfo ? this.generateEntityFullInfo(entityInfo) : null
                                    })(),
                                },
                            })
                        } else {
                            player.emit(PLAYER_RESPONSES.INCOMING_DATA, {
                                type: 'current_entity_info',
                                payload: {
                                    entity: null,
                                },
                            })
                        }
                        break
                    }

                    case 'entity_tooltip': {
                        const { square } = payload
                        const entity = this.gameState.getCharacterOnSquare(square)
                        if (entity) {
                            player.emit(PLAYER_RESPONSES.INCOMING_DATA, {
                                type: 'entity_tooltip',
                                payload: {
                                    entity: this.generateEntityToolTip(entity),
                                },
                            })
                        } else {
                            player.emit(PLAYER_RESPONSES.INCOMING_DATA, {
                                type: 'entity_tooltip',
                                payload: {
                                    entity: null,
                                },
                            })
                        }
                        break
                    }
                    case 'controlled_entities':
                        player.emit(PLAYER_RESPONSES.INCOMING_DATA, {
                            type: 'controlled_entities',
                            payload: {
                                newControlledEntities: this.generateEntityFullInfoForPlayer(player.id),
                            },
                        })
                        break
                    case 'battlefield':
                        player.emit(PLAYER_RESPONSES.INCOMING_DATA, {
                            type: 'battlefield',
                            payload: {
                                battlefield: this.generateBattlefieldPlayers(),
                            },
                        })
                        break
                    default:
                        player.emit(PLAYER_RESPONSES.INCOMING_DATA, {
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

    private setupGmListeners(playerSocket: PlayerSocket, player: iPlayer) {
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
                if (this.isConnectedToGameServer()) {
                    this.sendToServer(GAME_SERVER_RESPONSES.START_COMBAT)
                } else {
                    this.gameSocket.connect()
                    setTimeout(() => {
                        if (this.isConnectedToGameServer()) {
                            this.sendToServer(GAME_SERVER_RESPONSES.START_COMBAT)
                        }
                        this.sendToPlayer(player.id, PLAYER_RESPONSES.ERROR, {
                            message: 'Game server not connected',
                        })
                    }, 500)
                }
            },
            [GM_EVENTS.END_COMBAT]: () => {
                this.broadcast(PLAYER_RESPONSES.HALT_ACTION)
                this.sendToServer(GAME_SERVER_RESPONSES.END_COMBAT)
            },
        }
        this.addBatchOfEventsListener(playerSocket, GM_LISTENERS)
    }

    private addBatchOfEventsListener(
        socket: PlayerSocket | GameSocketType,
        listeners: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            statusEffects: entity.statusEffects.map((effect) => {
                return {
                    decorations: effect.decorations,
                    duration: effect.duration,
                }
            }),
        }
    }

    private generateEntityFullInfo(entity: EntityInfo): EntityInfoFull {
        const {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            controlledBy,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            id_,
            ...entityInfo
        } = entity
        return {
            ...entityInfo,
        }
    }

    private generateEntityFullInfoForPlayer(playerId: string): Array<EntityInfoFull> {
        const res: Array<EntityInfoFull> = []
        Object.values(this.gameState.allEntitiesInfo).forEach((entity) => {
            if (entity && entity.controlledBy.type === 'player' && entity.controlledBy.id === playerId) {
                res.push(this.generateEntityFullInfo(entity))
            }
        })
        return res
    }

    private sendOutTurnOrderToPlayers() {
        const turnOrder = this.generateGeneralTurnOrderInfo()
        for (const player of this.players) {
            player.emit(PLAYER_RESPONSES.TURN_ORDER_UPDATED, {
                turnOrder: this.generateIndividualTurnOrder(player.id, turnOrder),
            })
        }
    }

    private sendActionTimeStampsToPlayers() {
        this.broadcast(PLAYER_RESPONSES.ACTION_TIMESTAMP, {
            timestamp: this.gameState.turnInfo.actionTimeStamp,
        })
    }

    private generateIndividualTurnOrder(
        playerId: string,
        turnOrder?: Array<CharacterInTurnOrder | null>
    ): IndividualTurnOrder {
        if (!turnOrder) {
            turnOrder = this.generateGeneralTurnOrderInfo()
        }
        return turnOrder.map((entity) => {
            if (entity === null) {
                return null
            }
            return {
                ...entity,
                controlledByYou: entity.controlledBy.type === 'player' && entity.controlledBy.id === playerId,
            }
        })
    }

    private generateGeneralTurnOrderInfo(): Array<CharacterInTurnOrder | null> {
        const turnOrderInfo: Array<CharacterInTurnOrder | null> = []
        for (const entityId of this.gameState.turnInfo.order) {
            if (entityId === null) {
                turnOrderInfo.push(null)
                continue
            }
            const entity = this.gameState.getCharacterById(entityId)
            if (entity) {
                turnOrderInfo.push({
                    controlledBy: entity.controlledBy,
                    descriptor: entity.descriptor,
                    decorations: entity.decorations,
                    square: {
                        line: entity.square.line,
                        column: entity.square.column,
                    },
                })
            }
        }
        return turnOrderInfo
    }

    private createHandshake(playerId: string): GameHandshakePlayers {
        return {
            roundCount: this.gameState.roundCount,
            messages: this.gameState.messages.slice(-10),
            combatStatus: this.gameState.battleResult,
            currentBattlefield: this.generateBattlefieldPlayers(),
            turnOrder: this.generateIndividualTurnOrder(playerId),
            controlledEntities: this.generateEntityFullInfoForPlayer(playerId),
            gameLobbyState: this.getGameLobbyState(),
            actionTimestamp: this.gameState.turnInfo.actionTimeStamp ?? null,
        }
    }

    private generateBattlefieldPlayers(): BattlefieldPlayers {
        const { pawns } = this.gameState.currentBattlefield
        const res: BattlefieldPlayers = {
            pawns: {},
        }
        for (const [square, pawn] of Object.entries(pawns)) {
            if (pawn.character_id) {
                const entityOnSquare = this.gameState.getCharacterById(pawn.character_id)
                res.pawns[square] = {
                    character: entityOnSquare === null ? entityOnSquare : this.generateEntityToolTip(entityOnSquare),
                    areaEffects: pawn.area_effects,
                }
            }
        }
        return res
    }

    private emitTakeActionToPlayer() {
        const trySending = (user_token: string | null, entity_id: string): boolean => {
            if (!user_token) {
                return this.sendToGm(GM_RESPONSES.TAKE_UNALLOCATED_ACTION, {
                    entityId: entity_id,
                    actions: this.gameState.turnInfo.actions,
                })
            }
            if (user_token && this.players.find((player) => player.id === user_token)) {
                this.sendToPlayer(user_token, PLAYER_RESPONSES.TAKE_ACTION, {
                    entityId: entity_id,
                    actions: this.gameState.turnInfo.actions,
                })
                return true
            } else {
                return this.sendToGm(GM_RESPONSES.TAKE_OFFLINE_PLAYER_ACTION, {
                    entityId: entity_id,
                    actions: this.gameState.turnInfo.actions,
                })
            }
        }
        const { playerId, order } = this.gameState.turnInfo
        const current = order[0]
        if (current && !trySending(playerId, current)) {
            setTimeout(() => {
                if (!trySending(playerId, current)) {
                    this.sendToServer(GAME_SERVER_RESPONSES.PLAYER_CHOICE, {
                        game_id: this.gameId,
                        user_token: playerId,
                        choices: {
                            action: 'builtins:skip',
                        },
                    })
                }
            }, 1000)
        }
    }

    public getActivePlayers(): Array<string> {
        return this.players.filter((player) => player.isConnected()).map((player) => player.id)
    }

    public getGameLobbyState(): iGameLobbyState {
        const state: iGameLobbyState = {
            players: [],
        }
        for (const player of this.players) {
            state.players.push({
                userId: player.id,
                isGm: player.id === this.gmId,
                isConnected: player.isConnected() ?? false,
            })
        }
        return state
    }

    public broadcastGameLobbyStateUpdate() {
        this.broadcast(PLAYER_RESPONSES.GAME_LOBBY_STATE, this.getGameLobbyState())
    }
}
