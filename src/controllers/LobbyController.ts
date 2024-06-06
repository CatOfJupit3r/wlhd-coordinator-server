import { Request, Response } from 'express'
import { Socket } from 'socket.io'
import { DESCRIPTOR_REGEX } from '../configs'
import { BadRequest, Forbidden, InternalServerError, MethodNotAllowed, NotFound } from '../models/ErrorModels'
import { CombatClass } from '../models/TypegooseModels'
import AuthService from '../services/AuthService'
import DatabaseService from '../services/DatabaseService'
import InputValidator from '../services/InputValidator'
import LobbyService from '../services/LobbyService'
import { getEmittableCombatPreset } from '../utils/getEmittableCombatPreset'

class LobbyController {
    public async getCustomTranslations(req: Request, res: Response): Promise<void> {
        const { lobby_id } = req.params
        InputValidator.validateParams({ lobby_id }, { lobby_id: 'string' })
        const user = AuthService.verifyAuthorizationHeader(req.headers.authorization)
        const translations = await LobbyService.getCustomTranslations(lobby_id, user._id)
        res.status(200).json(translations)
    }

    public async createNewLobby(req: Request, res: Response): Promise<void> {
        console.log('Creating lobby. Params:', req.body)
        const { lobbyName, gm_id } = req.body
        InputValidator.validateObject({ lobbyName, gm_id }, { lobbyName: 'string', gm_id: 'string' })
        const lobby_id = await LobbyService.createNewLobby(lobbyName, gm_id)
        console.log('Lobby created', lobby_id)
        res.status(200).json({ result: 'ok', lobby_id })
    }

    public async addPlayerToLobby(req: Request, res: Response): Promise<void> {
        const { lobby_id } = req.params
        InputValidator.validateParams({ lobby_id }, { lobby_id: 'string' })
        const { player_id, nickname } = req.body
        InputValidator.validateObject({ player_id, nickname }, { player_id: 'string', nickname: 'string' })
        await LobbyService.addPlayerToLobby(lobby_id, player_id, nickname)
        res.json({ result: 'ok', player_id })
    }

    public async getLobbyInfo(req: Request, res: Response): Promise<void> {
        const { lobby_id } = req.params
        InputValidator.validateParams({ lobby_id }, { lobby_id: 'string' })
        const lobby = await DatabaseService.getLobby(lobby_id)
        const user = AuthService.verifyAuthorizationHeader(req.headers.authorization)
        if (!lobby) throw new BadRequest('Lobby not found!')
        const player = lobby.players.find((player) => player.userId === user._id)
        if (!player) throw new Forbidden('You are not a player in this lobby!')

        const { short } = req.query
        if (short && short === 'true') {
            res.status(200).json(await LobbyService.getShortLobbyInfo(lobby_id, user._id))
        } else {
            res.status(200).json(await LobbyService.getFullLobbyInfo(lobby_id, user, player))
        }
    }

    public async createCombatForLobby(req: Request, res: Response): Promise<void> {
        const { lobby_id } = req.params
        InputValidator.validateParams({ lobby_id }, { lobby_id: 'string' })

        const {
            combatNickname,
            combatPreset,
        }: {
            combatNickname: string
            combatPreset: CombatClass['field']
        } = req.body
        InputValidator.validateObject(
            { combatNickname, combatPreset },
            { combatNickname: 'string', combatPreset: 'object' }
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
        const { lobby_id, descriptor } = req.params
        InputValidator.validateParams({ lobby_id, descriptor }, { lobby_id: 'string', descriptor: 'string' })
        const { player_id } = req.body
        InputValidator.validateField({ key: 'player_id', value: player_id }, 'string')
        await LobbyService.assignCharacterToPlayer(lobby_id, player_id, descriptor)
        res.status(200).json({ message: 'ok', player_id, descriptor })
    }

    public async removeCharacterFromPlayer(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor } = req.params
        InputValidator.validateParams({ lobby_id, descriptor }, { lobby_id: 'string', descriptor: 'string' })
        const { player_id } = req.body
        InputValidator.validateField({ key: 'player_id', value: player_id }, 'string')
        await LobbyService.removeCharacterFromPlayer(lobby_id, player_id, descriptor)
        res.status(200).json({ message: 'ok', player_id, descriptor })
    }

    public async getMyCharacterInfo(req: Request, res: Response): Promise<void> {
        const { lobby_id } = req.params
        InputValidator.validateParams({ lobby_id }, { lobby_id: 'string' })
        const user = AuthService.verifyAuthorizationHeader(req.headers.authorization)
        const characters = await LobbyService.getMyCharactersInfo(lobby_id, user._id)
        res.status(200).json({
            characters,
        })
    }

    public async getCharacterInfo(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor } = req.params
        InputValidator.validateParams({ lobby_id, descriptor }, { lobby_id: 'string', descriptor: 'string' })
        const user = AuthService.verifyAuthorizationHeader(req.headers.authorization)
        const characterInfo = await LobbyService.getCharacterInfo(lobby_id, user._id, descriptor)
        res.status(200).json(characterInfo)
    }

    public async createCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id } = req.params
        InputValidator.validateParams({ lobby_id }, { lobby_id: 'string' })
        const { descriptor, decorations, attributes, controlledBy } = req.body
        InputValidator.validateObject(
            { descriptor, decorations, attributes },
            { descriptor: 'string', attributes: 'array', decorations: 'any' }
        )
        InputValidator.validateObject(decorations, { name: 'string', description: 'string', sprite: 'string' })
        for (const attribute of attributes) {
            InputValidator.validateObject(attribute, { dlc: 'string', descriptor: 'string', value: 'number' })
        }
        await LobbyService.createNewCharacter(lobby_id, controlledBy, descriptor, decorations, attributes)
        res.status(200).json({ result: 'ok', descriptor })
    }

    public async addWeaponToCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor: characterDescriptor } = req.params
        InputValidator.validateParams(
            { lobby_id, descriptor: characterDescriptor },
            {
                lobby_id: 'string',
                descriptor: 'string',
            }
        )
        const { descriptor: weaponDescriptor } = req.body
        InputValidator.validateField({ key: 'descriptor', value: weaponDescriptor }, 'string')
        if (!DESCRIPTOR_REGEX().test(weaponDescriptor)) throw new BadRequest('Invalid descriptor')
        const quantity = req.body.quantity || 1
        InputValidator.validateField({ key: 'quantity', value: quantity }, 'number')
        await LobbyService.addWeaponToCharacter(lobby_id, characterDescriptor, weaponDescriptor, quantity)
        res.status(200).json({ message: 'ok', characterDescriptor, weaponDescriptor, quantity })
    }

    public async addSpellToCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor: characterDescriptor } = req.params
        InputValidator.validateParams(
            { lobby_id, descriptor: characterDescriptor },
            {
                lobby_id: 'string',
                descriptor: 'string',
            }
        )
        const { descriptor: spellDescriptor } = req.body
        InputValidator.validateField({ key: 'descriptor', value: spellDescriptor }, 'string')
        if (!DESCRIPTOR_REGEX().test(spellDescriptor)) throw new BadRequest('Invalid descriptor')
        const { conflictsWith, requiresToUse } = {
            conflictsWith: req.body.conflictsWith || [],
            requiresToUse: req.body.requiresToUse || [],
        }
        InputValidator.validateObject(
            { conflictsWith, requiresToUse },
            { conflictsWith: 'array', requiresToUse: 'array' }
        )
        await LobbyService.addSpellToCharacter(
            lobby_id,
            characterDescriptor,
            spellDescriptor,
            conflictsWith,
            requiresToUse
        )
        res.status(200).json({ message: 'ok', characterDescriptor, spellDescriptor, conflictsWith, requiresToUse })
    }

    public async addStatusEffectToCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor: characterDescriptor } = req.params
        InputValidator.validateParams(
            { lobby_id, descriptor: characterDescriptor },
            {
                lobby_id: 'string',
                descriptor: 'string',
            }
        )
        const { descriptor: effectDescriptor, duration } = req.body
        InputValidator.validateObject(
            { descriptor: effectDescriptor, duration },
            {
                descriptor: 'string',
                duration: 'number',
            }
        )
        if (!DESCRIPTOR_REGEX().test(effectDescriptor)) throw new BadRequest('Invalid descriptor')
        await LobbyService.addStatusEffectToCharacter(lobby_id, characterDescriptor, effectDescriptor, duration)
        res.status(200).json({ message: 'ok', characterDescriptor, effectDescriptor, duration })
    }

    public async addItemToCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor: characterDescriptor } = req.params
        InputValidator.validateParams(
            { lobby_id, descriptor: characterDescriptor },
            {
                lobby_id: 'string',
                descriptor: 'string',
            }
        )
        const { descriptor: itemDescriptor } = req.body
        InputValidator.validateField({ key: 'descriptor', value: itemDescriptor }, 'string')
        if (!DESCRIPTOR_REGEX().test(itemDescriptor)) throw new BadRequest('Invalid descriptor')
        const quantity = req.body.quantity || 1
        InputValidator.validateField({ key: 'quantity', value: quantity }, 'number')
        await LobbyService.addItemToCharacter(lobby_id, characterDescriptor, itemDescriptor, quantity)
        res.status(200).json({ message: 'ok', characterDescriptor, itemDescriptor, quantity })
    }

    public async addAttributeToCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor: characterDescriptor } = req.params
        InputValidator.validateParams(
            { lobby_id, descriptor: characterDescriptor },
            {
                lobby_id: 'string',
                descriptor: 'string',
            }
        )
        const { dlc, descriptor: attributeDescriptor, value } = req.body
        if (!DESCRIPTOR_REGEX().test(`${dlc}:${attributeDescriptor}`)) throw new BadRequest('Invalid descriptor')
        InputValidator.validateObject(
            { dlc, descriptor: attributeDescriptor, value },
            {
                dlc: 'string',
                descriptor: 'string',
                value: 'number',
            }
        )
        await LobbyService.addAttributeToCharacter(lobby_id, characterDescriptor, dlc, attributeDescriptor, value)
        res.status(200).json({ message: 'ok', characterDescriptor, dlc, attributeDescriptor, value })
    }

    public async changeSpellLayoutOfCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor: characterDescriptor } = req.params
        InputValidator.validateParams(
            { lobby_id, descriptor: characterDescriptor },
            {
                lobby_id: 'string',
                descriptor: 'string',
            }
        )
        const { layout } = req.body
        InputValidator.validateField({ key: 'layout', value: layout }, 'array')
        await LobbyService.changeSpellLayoutOfCharacter(lobby_id, characterDescriptor, layout)
        res.status(200).json({ message: 'ok', characterDescriptor, layout })
    }

    public async updateCharacter(req: Request, res: Response): Promise<void> {
        throw new MethodNotAllowed('Not implemented')
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
