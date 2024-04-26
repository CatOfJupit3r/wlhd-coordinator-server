import { Request, Response } from 'express'
import { Socket } from 'socket.io'
import { BadRequest, Forbidden, InternalServerError, NotFound, Unauthorized } from '../models/ErrorModels'
import AuthService from '../services/AuthService'
import DatabaseService from '../services/DatabaseService'
import LobbyService from '../services/LobbyService'
import { getEmittableCombatPreset } from '../utils/getEmittableCombatPreset'

class LobbyController {
    public async createNewLobby(req: Request, res: Response): Promise<void> {
        console.log('Creating lobby. Params:', req.body)
        const { lobbyName, gm_id } = req.body
        if (!lobbyName || !gm_id)
            throw new BadRequest(`Missing parameters: ${!lobbyName ? 'lobbyName' : ''} ${!gm_id ? 'gm_id' : ''}`)
        const lobby_id = await DatabaseService.createNewLobby(lobbyName, gm_id)
        console.log('Lobby created', lobby_id)
        res.status(200).json({ result: 'ok', lobby_id })
    }

    public async addPlayerToLobby(req: Request, res: Response): Promise<void> {
        console.log('Adding player to lobby. Params:', req.body)
        const { lobby_id } = req.params
        const { player_id, nickname, mainCharacter } = req.body
        if (!lobby_id || !player_id || !nickname || !mainCharacter) {
            throw new BadRequest(
                `Missing parameters: ${!lobby_id ? 'lobby_id' : ''} ${!player_id ? 'player_id' : ''} ${!nickname ? 'nickname' : ''} ${!mainCharacter ? 'mainCharacter' : ''}`
            )
        }
        await LobbyService.addPlayerToLobby(lobby_id, player_id, nickname, mainCharacter)
        res.json({ result: 'ok', player_id })
    }

    public async getLobbyInfo(req: Request, res: Response): Promise<void> {
        const { lobby_id } = req.params
        const lobby = await DatabaseService.getLobby(lobby_id)
        if (!req.headers.authorization) throw new Unauthorized('No token provided!')
        const user = AuthService.verifyAccessToken(req.headers.authorization)
        if (!lobby) throw new BadRequest('Lobby not found!')

        const player = lobby.players.find((player) => player.userId === user._id)
        if (!player) throw new Forbidden('You are not a player in this lobby!')
        res.status(200).json(await LobbyService.getLobbyInfo(lobby_id, user, player))
    }

    public async createCombatForLobby(req: Request, res: Response): Promise<void> {
        const { lobby_id } = req.params

        interface CombatPreset {
            field: {
                [square: string]: {
                    path: string
                    source: string
                    controlledBy: {
                        type: string
                        id: string
                    }
                }
            }
        }

        const {
            combatNickname,
            combatPreset,
        }: {
            combatNickname: string
            combatPreset: CombatPreset
        } = req.body

        console.log('Creating combat for lobby', req.body)
        if (!lobby_id || !combatPreset || !combatNickname)
            throw new BadRequest('Missing parameters', {
                required: [
                    { lobby_id: 'string', present: !!lobby_id },
                    { combatPreset: 'object', present: !!combatPreset },
                    { combatNickname: 'string', present: !!combatNickname },
                ],
                provided: req.body,
            })
        const lobby = await DatabaseService.getLobby(lobby_id)
        if (!lobby) throw new NotFound('Lobby not found')
        const preset = await getEmittableCombatPreset(combatPreset)
        if (!preset) throw new NotFound('Preset not found')
        const combat_id = LobbyService.createCombat(
            lobby_id,
            combatNickname,
            preset,
            lobby.gm_id,
            lobby.players.map((player) => player.userId)
        )
        if (combat_id) {
            res.status(200).json({ message: 'ok', combat_id })
        } else throw new InternalServerError('Failed to create combat')
    }

    public getAllActiveCombats(req: Request, res: Response): void {
        const { lobby_id } = req.params
        const combats = LobbyService.getActiveCombats(lobby_id)
        if (!combats) throw new NotFound('No combats found')
        res.status(200).json({ nicknames: Array.from(combats.keys()) })
    }

    public async assignCharacterToPlayer(req: Request, res: Response): Promise<void> {
        console.log('Assigning character to player. Params:', req.body)
        const { lobby_id } = req.params
        const { player_id, character_id } = req.body
        if (!lobby_id || !player_id || !character_id)
            throw new BadRequest(
                `Missing parameters: ${!lobby_id ? 'lobby_id' : ''} ${!player_id ? 'player_id' : ''} ${!character_id ? 'character_id' : ''}`
            )
        await DatabaseService.assignCharacterToPlayer(lobby_id, player_id, character_id)
        res.status(200).json({ message: 'ok' })
    }

    public async getMyCharacterInfo(req: Request, res: Response): Promise<void> {
        const { lobby_id } = req.params
        if (!req.headers.authorization) throw new Unauthorized('No token provided!')
        const user = AuthService.verifyAccessToken(req.headers.authorization)
        const character = await LobbyService.getMyCharacterInfo(lobby_id, user._id)
        res.status(200).json(character)
    }

    public async getCharacterInfo(req: Request, res: Response): Promise<void> {
        const { lobby_id, character } = req.params
        const characterInfo = await LobbyService.getCharacterInfo(lobby_id, character)
        res.status(200).json(characterInfo)
    }

    public onConnection(socket: Socket): void {
        const { combatId, userToken } = socket.handshake.query
        if (!combatId || !userToken) {
            socket.disconnect()
            return
        }
        console.log('Trying to establish connection: ', combatId, userToken)
        LobbyService.manageSocket(socket, combatId as string, userToken as string)
    }
}

export default new LobbyController()
