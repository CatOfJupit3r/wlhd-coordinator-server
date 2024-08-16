import { Request, Response } from 'express'
import { isNull } from 'lodash'
import { Socket } from 'socket.io'
import { DESCRIPTOR_REGEX } from '../configs'
import { BadRequest, Forbidden, InternalServerError, NotFound } from '../models/ErrorModels'
import { EntityInfoFullToCharacterClass } from '../models/GameEditorModels'
import { AttributeInfo, ItemInfo, StatusEffectInfo, WeaponInfo } from '../models/ServerModels'
import { CombatClass } from '../models/TypegooseModels'
import { Schema } from '../models/Validation'
import AuthService from '../services/AuthService'
import DatabaseService from '../services/DatabaseService'
import InputValidator from '../services/InputValidator'
import LobbyService from '../services/LobbyService'
import { getEmittableCombatPreset } from '../utils/getEmittableCombatPreset'

class LobbyController {
    public async getCustomTranslations(req: Request, res: Response): Promise<void> {
        const { lobby_id } = req.params
        InputValidator.validateParams({ lobby_id }, { lobby_id: 'objectId' })
        const user = AuthService.verifyAuthorizationHeader(req.headers.authorization)
        const translations = await LobbyService.getCustomTranslations(lobby_id, user._id)
        res.status(200).json(translations)
    }

    public async createNewLobby(req: Request, res: Response): Promise<void> {
        console.log('Creating lobby. Params:', req.body)
        const { lobbyName, gm_id } = req.body
        InputValidator.validateObject({ lobbyName, gm_id }, { lobbyName: 'string', gm_id: 'objectId' })
        const lobby_id = await LobbyService.createNewLobby(lobbyName, gm_id)
        console.log('Lobby created', lobby_id)
        res.status(200).json({ result: 'ok', lobby_id })
    }

    public async addPlayerToLobby(req: Request, res: Response): Promise<void> {
        const { lobby_id } = req.params
        InputValidator.validateParams({ lobby_id }, { lobby_id: 'string' })
        const { player_id, nickname } = req.body
        InputValidator.validateObject({ player_id, nickname }, { player_id: 'objectId', nickname: 'string' })
        await LobbyService.addPlayerToLobby(lobby_id, player_id, nickname)
        res.status(200).json({ result: 'ok', player_id })
    }

    public async getLobbyInfo(req: Request, res: Response): Promise<void> {
        const { lobby_id } = req.params
        InputValidator.validateParams({ lobby_id }, { lobby_id: 'objectId' })
        const lobby = await DatabaseService.getLobby(lobby_id)
        const user = AuthService.verifyAuthorizationHeader(req.headers.authorization)
        if (!lobby) throw new BadRequest('Lobby not found!')
        const player = lobby.players.find((player) => player.userId === user._id)
        if (!player) throw new Forbidden('You are not a player in this lobby!')

        const { short } = req.query
        if (short && short === 'true') {
            res.status(200).json(await LobbyService.getShortLobbyInfo(lobby_id, user._id))
        } else {
            res.status(200).json(await LobbyService.getFullLobbyInfo(lobby_id, user._id))
        }
    }

    public async createCombatForLobby(req: Request, res: Response): Promise<void> {
        const { lobby_id } = req.params
        InputValidator.validateParams({ lobby_id }, { lobby_id: 'objectId' })

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
        InputValidator.validateParams({ lobby_id, descriptor }, { lobby_id: 'objectId', descriptor: 'string' })
        const { player_id } = req.body
        InputValidator.validateField({ key: 'player_id', value: player_id }, 'objectId')
        await LobbyService.assignCharacterToPlayer(lobby_id, player_id, descriptor)
        res.status(200).json({ message: 'ok', player_id, descriptor })
    }

    public async removeCharacterFromPlayer(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor } = req.params
        InputValidator.validateParams({ lobby_id, descriptor }, { lobby_id: 'objectId', descriptor: 'string' })
        const { player_id } = req.body
        InputValidator.validateField({ key: 'player_id', value: player_id }, 'objectId')
        await LobbyService.removeCharacterFromPlayer(lobby_id, player_id, descriptor)
        res.status(200).json({ message: 'ok', player_id, descriptor })
    }

    public async getMyCharacterInfo(req: Request, res: Response): Promise<void> {
        const { lobby_id } = req.params
        InputValidator.validateParams({ lobby_id }, { lobby_id: 'objectId' })
        const user = AuthService.verifyAuthorizationHeader(req.headers.authorization)
        const characters = await LobbyService.getMyCharactersInfo(lobby_id, user._id)
        res.status(200).json({
            characters,
        })
    }

    public async getCharacterInfo(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor } = req.params
        InputValidator.validateParams({ lobby_id, descriptor }, { lobby_id: 'objectId', descriptor: 'string' })
        const user = AuthService.verifyAuthorizationHeader(req.headers.authorization)
        const characterInfo = await LobbyService.getCharacterInfo(lobby_id, user._id, descriptor)
        res.status(200).json(characterInfo)
    }

    public async createCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id } = req.params
        InputValidator.validateParams({ lobby_id }, { lobby_id: 'objectId' })
        const { descriptor, decorations, attributes, controlledBy } = req.body
        InputValidator.validateObject(
            { descriptor, decorations, attributes },
            { descriptor: 'string', attributes: 'array', decorations: 'any' }
        )
        InputValidator.validateObject(decorations, { name: 'string', description: 'string', sprite: 'string' })
        for (const attribute of attributes) {
            InputValidator.validateObject(attribute, { dlc: 'string', descriptor: 'string', value: 'number' })
        }
        await LobbyService.createNewCharacter(
            lobby_id,
            controlledBy,
            descriptor,
            decorations,
            attributes.map((attribute: { dlc: string; descriptor: string; value: number }) => ({
                descriptor: `${attribute.dlc}:${attribute.descriptor}`,
                value: attribute.value,
            }))
        )
        res.status(200).json({ result: 'ok', descriptor })
    }

    public async deleteCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor } = req.params
        InputValidator.validateParams({ lobby_id, descriptor }, { lobby_id: 'objectId', descriptor: 'string' })
        await LobbyService.deleteCharacter(lobby_id, descriptor)
        res.status(200).json({ message: 'ok', descriptor })
    }

    public async getWeaponryOfCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor } = req.params
        InputValidator.validateParams(
            { lobby_id, descriptor },
            {
                lobby_id: 'objectId',
                descriptor: 'string',
            }
        )
        res.status(200).json({
            weaponry: await LobbyService.getWeaponryOfCharacter(lobby_id, descriptor),
        } as { weaponry: Array<WeaponInfo> })
    }

    public async getInventoryOfCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor } = req.params
        InputValidator.validateParams(
            { lobby_id, descriptor },
            {
                lobby_id: 'objectId',
                descriptor: 'string',
            }
        )
        res.status(200).json({
            inventory: await LobbyService.getInventoryOfCharacter(lobby_id, descriptor),
        } as { inventory: Array<ItemInfo> })
    }

    public async getSpellbookOfCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor } = req.params
        InputValidator.validateParams(
            { lobby_id, descriptor },
            {
                lobby_id: 'objectId',
                descriptor: 'string',
            }
        )
        res.status(200).json({
            spells: await LobbyService.getSpellbookOfCharacter(lobby_id, descriptor),
        })
    }

    public async getStatusEffectsOfCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor } = req.params
        InputValidator.validateParams(
            { lobby_id, descriptor },
            {
                lobby_id: 'objectId',
                descriptor: 'string',
            }
        )
        res.status(200).json({
            status_effects: await LobbyService.getStatusEffectsOfCharacter(lobby_id, descriptor),
        } as { status_effects: Array<StatusEffectInfo> })
    }

    public async getAttributesOfCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor } = req.params
        InputValidator.validateParams(
            { lobby_id, descriptor },
            {
                lobby_id: 'objectId',
                descriptor: 'string',
            }
        )
        res.status(200).json({
            attributes: await LobbyService.getAttributesOfCharacter(lobby_id, descriptor),
        } as { attributes: AttributeInfo })
    }

    public async addWeaponToCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor: characterDescriptor } = req.params
        InputValidator.validateParams(
            { lobby_id, descriptor: characterDescriptor },
            {
                lobby_id: 'objectId',
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
                lobby_id: 'objectId',
                descriptor: 'string',
            }
        )
        const { descriptor: spellDescriptor } = req.body
        InputValidator.validateField({ key: 'descriptor', value: spellDescriptor }, 'string')
        if (!DESCRIPTOR_REGEX().test(spellDescriptor)) throw new BadRequest('Invalid descriptor')
        await LobbyService.addSpellToCharacter(lobby_id, characterDescriptor, spellDescriptor)
        res.status(200).json({ message: 'ok', characterDescriptor, spellDescriptor })
    }

    public async addStatusEffectToCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor: characterDescriptor } = req.params
        InputValidator.validateParams(
            { lobby_id, descriptor: characterDescriptor },
            {
                lobby_id: 'objectId',
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
                lobby_id: 'objectId',
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
                lobby_id: 'objectId',
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

    public async updateCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor } = req.params
        InputValidator.validateParams({ lobby_id, descriptor }, { lobby_id: 'objectId', descriptor: 'string' })
        const lobby = await DatabaseService.getLobby(lobby_id)
        const user = AuthService.verifyAuthorizationHeader(req.headers.authorization)
        if (!lobby) throw new NotFound('Lobby not found')
        if (lobby.gm_id !== user._id) throw new Forbidden('You are not the GM of this lobby')

        const attributeSchema = {
            descriptor: 'string',
            value: 'number',
        } as Schema
        const decorationSchema = {
            name: 'string',
            description: 'string',
            sprite: 'string',
        } as Schema
        const knownSpellsSchema = {
            descriptor: 'string',
        } as Schema
        const inventorySchema = {
            descriptor: 'string',
            quantity: 'number',
        } as Schema
        const statusEffectsSchema = {
            descriptor: 'string',
            duration: 'number',
        } as Schema
        const weaponrySchema = {
            descriptor: 'string',
            quantity: 'number',
        } as Schema

        const { decorations, attributes, spellBook, inventory, statusEffects, weaponry } = req.body
        InputValidator.validateObject(
            { decorations, attributes, spellBook, inventory, statusEffects, weaponry },
            {
                decorations: 'object',
                attributes: 'array',
                spellBook: 'object',
                inventory: 'array',
                statusEffects: 'array',
                weaponry: 'array',
            }
        )
        InputValidator.validateObject(decorations, decorationSchema)
        for (const attribute of attributes) {
            InputValidator.validateObject(attribute, attributeSchema)
        }
        if (typeof spellBook.maxActiveSpells === 'number') {
            if (spellBook.maxActiveSpells < 0) {
                throw new BadRequest('maxActiveSpells must be a positive number')
            }
        } else if (!isNull(spellBook.maxActiveSpells)) {
            throw new BadRequest('maxActiveSpells must be a positive number or null')
        }
        InputValidator.validateField({ key: 'knownSpells', value: spellBook.knownSpells }, 'array')
        for (const spell of spellBook.knownSpells) {
            InputValidator.validateObject(spell, knownSpellsSchema)
        }
        for (const item of inventory) {
            InputValidator.validateObject(item, inventorySchema)
        }
        for (const effect of statusEffects) {
            InputValidator.validateObject(effect, statusEffectsSchema)
        }
        for (const weapon of weaponry) {
            InputValidator.validateObject(weapon, weaponrySchema)
        }
        const NewCharacterClass = {
            decorations,
            attributes,
            spellBook: {
                maxActiveSpells: spellBook.maxActiveSpells,
                knownSpells: spellBook.knownSpells,
            },
            inventory,
            statusEffects,
            weaponry,
        } as EntityInfoFullToCharacterClass
        await DatabaseService.updateCharacter(lobby_id, descriptor, NewCharacterClass)
        res.status(200).json({ message: 'ok', descriptor })
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
