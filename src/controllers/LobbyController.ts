import { Request, Response } from 'express'
import { Socket } from 'socket.io'
import {
    BadRequest,
    Forbidden,
    InternalServerError,
    MethodNotAllowed,
    NotFound,
    Unauthorized,
} from '../models/ErrorModels'
import AuthService from '../services/AuthService'
import DatabaseService from '../services/DatabaseService'
import InputValidator from '../services/InputValidator'
import LobbyService from '../services/LobbyService'
import { getEmittableCombatPreset } from '../utils/getEmittableCombatPreset'

class LobbyController {
    public async createNewLobby(req: Request, res: Response): Promise<void> {
        console.log('Creating lobby. Params:', req.body)
        const { lobbyName, gm_id } = req.body
        InputValidator.validateObject({ lobbyName, gm_id }, { lobbyName: 'string', gm_id: 'string' }, true)
        const lobby_id = await DatabaseService.createNewLobby(lobbyName, gm_id)
        console.log('Lobby created', lobby_id)
        res.status(200).json({ result: 'ok', lobby_id })
    }

    public async addPlayerToLobby(req: Request, res: Response): Promise<void> {
        console.log('Adding player to lobby. Params:', req.body)
        const { lobby_id } = req.params
        const { player_id, nickname } = req.body
        InputValidator.validateObject(
            { lobby_id, player_id, nickname },
            { lobby_id: 'string', player_id: 'string', nickname: 'string' },
            true
        )
        await LobbyService.addPlayerToLobby(lobby_id, player_id, nickname)
        res.json({ result: 'ok', player_id })
    }

    public async getLobbyInfo(req: Request, res: Response): Promise<void> {
        const { lobby_id } = req.params
        InputValidator.validateField({ key: 'lobby_id', value: lobby_id }, 'string', true)
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
        InputValidator.validateObject(
            { lobby_id, combatNickname, combatPreset },
            { lobby_id: 'string', combatNickname: 'string', combatPreset: 'object' }
        )

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

    public async assignCharacterToPlayer(req: Request, res: Response): Promise<void> {
        console.log('Assigning character to player. Params:', req.body)
        const { lobby_id, character_id } = req.params
        const { player_id } = req.body
        InputValidator.validateObject({ lobby_id, player_id }, { lobby_id: 'string', player_id: 'string' }, true)
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
        const { lobby_id, character_id } = req.params
        InputValidator.validateObject({ lobby_id, character_id }, { lobby_id: 'string', character_id: 'string' }, true)
        const characterInfo = await LobbyService.getCharacterInfo(lobby_id, character_id)
        res.status(200).json(characterInfo)
    }

    public async createCharacter(req: Request, res: Response): Promise<void> {
        const { descriptor, decorations, attributes, controlledBy } = req.body
        const { lobby_id } = req.params
        InputValidator.validateObject(
            { descriptor, decorations, attributes, lobby_id },
            { descriptor: 'string', attributes: 'array', decorations: 'any', lobby_id: 'string' }
        )
        InputValidator.validateObject(decorations, { name: 'string', description: 'string', sprite: 'string' })
        for (const attribute of attributes) {
            InputValidator.validateObject(attribute, { dlc: 'string', descriptor: 'string', value: 'number' })
        }
        const entity_id = await DatabaseService.createNewCharacter(descriptor, decorations, attributes)
        await DatabaseService.addCharacterToLobby(lobby_id, entity_id.toString(), controlledBy)
        res.json({ result: 'ok', entity_id })
    }

    public async getCharacterWeaponry(req: Request, res: Response): Promise<void> {
        throw new MethodNotAllowed()
    }

    public async getCharacterSpellbook(req: Request, res: Response): Promise<void> {
        throw new MethodNotAllowed()
    }

    public async getCharacterStatusEffects(req: Request, res: Response): Promise<void> {
        throw new MethodNotAllowed()
    }

    public async getCharacterInventory(req: Request, res: Response): Promise<void> {
        throw new MethodNotAllowed()
    }

    public async getCharacterAttributes(req: Request, res: Response): Promise<void> {
        throw new MethodNotAllowed()
    }

    public async addWeaponToCharacter(req: Request, res: Response): Promise<void> {
        throw new MethodNotAllowed()
    }

    public async addSpellToCharacter(req: Request, res: Response): Promise<void> {
        throw new MethodNotAllowed()
    }

    public async addStatusEffectToCharacter(req: Request, res: Response): Promise<void> {
        throw new MethodNotAllowed()
    }

    public async addItemToCharacter(req: Request, res: Response): Promise<void> {
        throw new MethodNotAllowed()
    }

    public async addAttributeToCharacter(req: Request, res: Response): Promise<void> {
        throw new MethodNotAllowed()
    }

    public async updateCharacter(req: Request, res: Response): Promise<void> {
        throw new MethodNotAllowed()
    }

    public onConnection(socket: Socket): void {
        const { combatId, userToken } = socket.handshake.query
        if (
            !InputValidator.validateObject(
                { combatId, userToken },
                {
                    combatId: 'string',
                    userToken: 'string',
                },
                false
            ).success
        ) {
            socket.disconnect()
            return
        }
        console.log('Trying to establish connection: ', combatId, userToken)
        LobbyService.manageSocket(socket, combatId as string, userToken as string)
    }
}

export default new LobbyController()
