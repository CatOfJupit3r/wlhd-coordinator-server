import { DESCRIPTOR_NO_DLC_REGEX, DESCRIPTOR_REGEX } from '@configs'
import { BadRequest, Forbidden, InternalServerError, NotFound } from '@models/ErrorModels'
import { EntityInfoFullToCharacterClass } from '@models/GameEditorModels'
import { AttributeInfo } from '@models/ServerModels'
import {
    CharacterSchema,
    CreateGameLobbySchema,
    LobbySchema,
    LobbyWithDescriptorSchema,
} from '@schemas/LobbyControllerSchemas'
import AuthService from '@services/AuthService'
import DatabaseService from '@services/DatabaseService'
import LobbyService from '@services/LobbyService'
import { Request, Response } from 'express'
import { ExtendedSchema, Schema } from 'just-enough-schemas'
import { Types } from 'mongoose'
import { Socket } from 'socket.io'
import { z } from 'zod'

const stringIsObjectId = (value: unknown): value is Types.ObjectId => {
    return typeof value === 'string' && !!value && Types.ObjectId.isValid(value)
}

class LobbyController {
    public async getCustomTranslations(req: Request, res: Response): Promise<void> {
        const { lobby_id } = LobbySchema.parse(req.params)
        const user = AuthService.verifyAuthorizationHeader(req.headers.authorization)
        const translations = await LobbyService.getCustomTranslations(lobby_id, user._id)
        res.status(200).json(translations)
    }

    public async createNewLobby(req: Request, res: Response): Promise<void> {
        const schema = new ExtendedSchema<{ lobbyName: string; gm_id: string }>({ excess: 'forbid' })
        schema.addStringField('lobbyName')
        schema.addStringField('gm_id', {
            callback: (value: string) => {
                return Types.ObjectId.isValid(value)
            },
        })

        const validation = schema.check(req.body)
        if (!validation.success) {
            throw new BadRequest(validation.type, {
                reason: validation.type === 'CALLBACK_FAILED' ? 'Invalid gm_id' : validation.message,
            })
        }
        const { lobbyName, gm_id } = validation.value

        const lobby_id = await LobbyService.createNewLobby(lobbyName, gm_id)
        console.log('Lobby created', lobby_id)
        res.status(200).json({ result: 'ok', lobby_id })
    }

    public async addPlayerToLobby(req: Request, res: Response): Promise<void> {
        const { lobby_id } = LobbySchema.parse(req.params)
        const PlayerSchema = new ExtendedSchema<{ player_id: string; nickname: string }>({ excess: 'forbid' })
        PlayerSchema.addStringField('player_id', {
            callback: (value: string) => {
                return Types.ObjectId.isValid(value)
            },
        })
        PlayerSchema.addStringField('nickname')
        const playerValidation = PlayerSchema.check(req.body)
        if (!playerValidation.success) {
            throw new BadRequest(playerValidation.type, {
                reason: playerValidation.type === 'CALLBACK_FAILED' ? 'Invalid player_id' : playerValidation.message,
            })
        }
        const { player_id, nickname } = playerValidation.value
        await LobbyService.addPlayerToLobby(lobby_id, player_id, nickname)
        res.status(200).json({ result: 'ok', player_id })
    }

    public async getLobbyInfo(req: Request, res: Response): Promise<void> {
        const { lobby_id } = LobbySchema.parse(req.params)
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
        const { lobby_id } = LobbySchema.parse(req.params)

        const { nickname, preset } = CreateGameLobbySchema.parse(req.body)

        const lobby = await DatabaseService.getLobby(lobby_id)
        if (!lobby) throw new NotFound('Lobby not found')
        const combat_id = LobbyService.createCombat(
            lobby_id,
            nickname ?? 'RandomCombatName',
            preset,
            lobby.gm_id,
            lobby.players.map((player) => player.userId)
        )
        if (combat_id) {
            res.status(200).json({ message: 'ok', combat_id })
        } else throw new InternalServerError('Failed to create combat')
    }

    public async assignCharacterToPlayer(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor } = LobbyWithDescriptorSchema.parse(req.params)
        const { player_id } = z
            .object({
                player_id: z
                    .string()
                    .refine((value) => Types.ObjectId.isValid(value), { message: 'player_id is not a valid ObjectId' }),
            })
            .parse(req.body)
        if (!stringIsObjectId(player_id)) {
            throw new BadRequest('Invalid player_id')
        }
        await DatabaseService.assignCharacterToPlayer(lobby_id, player_id, descriptor)
        res.status(200).json({ message: 'ok', player_id, descriptor })
    }

    public async removeCharacterFromPlayer(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor } = LobbyWithDescriptorSchema.parse(req.params)
        const { player_id } = req.body
        if (!stringIsObjectId(player_id)) {
            throw new BadRequest('Invalid player_id')
        }
        await DatabaseService.removeCharacterFromPlayer(lobby_id, player_id, descriptor)
        res.status(200).json({ message: 'ok', player_id, descriptor })
    }

    public async getMyCharacterInfo(req: Request, res: Response): Promise<void> {
        const { lobby_id } = LobbySchema.parse(req.params)
        const user = AuthService.verifyAuthorizationHeader(req.headers.authorization)
        const characters = await LobbyService.getMyCharactersInfo(lobby_id, user._id)
        res.status(200).json({
            characters,
        })
    }

    public async getCharacterInfo(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor } = LobbyWithDescriptorSchema.parse(req.params)
        const user = AuthService.verifyAuthorizationHeader(req.headers.authorization)
        const characterInfo = await LobbyService.getCharacterInfo(lobby_id, user._id, descriptor)
        res.status(200).json(characterInfo)
    }

    public async createCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id } = LobbySchema.parse(req.params)
        const { descriptor, decorations, attributes, controlledBy } = req.body
        if (!descriptor || !DESCRIPTOR_NO_DLC_REGEX().test(descriptor)) throw new BadRequest('Invalid descriptor')
        const decorationsSchema = z
            .object({
                name: z.string(),
                description: z.string(),
                sprite: z.string(),
            })
            .strict()
        decorationsSchema.parse(decorations)
        const attributeSchema = z
            .object({
                dlc: z.string(),
                descriptor: z.string(),
                value: z.number(),
            })
            .strict()
        const attributesSchema = z.array(attributeSchema)
        attributesSchema.parse(attributes)

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
        const { lobby_id, descriptor } = LobbyWithDescriptorSchema.parse(req.params)
        await LobbyService.deleteCharacter(lobby_id, descriptor)
        res.status(200).json({ message: 'ok', descriptor })
    }

    public async getWeaponryOfCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor } = LobbyWithDescriptorSchema.parse(req.params)
        res.status(200).json({
            weaponry: await LobbyService.getWeaponryOfCharacter(lobby_id, descriptor),
        })
    }

    public async getInventoryOfCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor } = LobbyWithDescriptorSchema.parse(req.params)
        res.status(200).json({
            inventory: await LobbyService.getInventoryOfCharacter(lobby_id, descriptor),
        })
    }

    public async getSpellbookOfCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor } = LobbyWithDescriptorSchema.parse(req.params)
        res.status(200).json({
            spells: await LobbyService.getSpellbookOfCharacter(lobby_id, descriptor),
        })
    }

    public async getStatusEffectsOfCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor } = LobbyWithDescriptorSchema.parse(req.params)
        res.status(200).json({
            status_effects: await LobbyService.getStatusEffectsOfCharacter(lobby_id, descriptor),
        })
    }

    public async getAttributesOfCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor } = LobbyWithDescriptorSchema.parse(req.params)
        res.status(200).json({
            attributes: await LobbyService.getAttributesOfCharacter(lobby_id, descriptor),
        } as { attributes: AttributeInfo })
    }

    public async addWeaponToCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor: characterDescriptor } = LobbyWithDescriptorSchema.parse(req.params)
        const { descriptor: weaponDescriptor } = req.body

        if (!weaponDescriptor || !DESCRIPTOR_REGEX().test(weaponDescriptor)) throw new BadRequest('Invalid descriptor')
        const quantity = req.body.quantity || 1
        if (!isNaN(parseInt(quantity)) && typeof quantity !== 'number') throw new BadRequest('Invalid quantity')
        await LobbyService.addWeaponToCharacter(lobby_id, characterDescriptor, weaponDescriptor, quantity)
        res.status(200).json({ message: 'ok', characterDescriptor, weaponDescriptor, quantity })
    }

    public async addSpellToCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor: characterDescriptor } = LobbyWithDescriptorSchema.parse(req.params)

        const { descriptor: spellDescriptor } = req.body
        if (!spellDescriptor || !DESCRIPTOR_REGEX().test(spellDescriptor)) throw new BadRequest('Invalid descriptor')
        await LobbyService.addSpellToCharacter(lobby_id, characterDescriptor, spellDescriptor)
        res.status(200).json({ message: 'ok', characterDescriptor, spellDescriptor })
    }

    public async addStatusEffectToCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor: characterDescriptor } = LobbyWithDescriptorSchema.parse(req.params)
        const { descriptor: effectDescriptor, duration } = z
            .object({
                descriptor: z.string().refine((value) => DESCRIPTOR_REGEX().test(value), 'Invalid descriptor'),
                duration: z.number().min(1),
            })
            .parse(req.body)
        await LobbyService.addStatusEffectToCharacter(lobby_id, characterDescriptor, effectDescriptor, duration)
        res.status(200).json({ message: 'ok', characterDescriptor, effectDescriptor, duration })
    }

    public async addItemToCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor: characterDescriptor } = LobbyWithDescriptorSchema.parse(req.params)
        const { descriptor: itemDescriptor } = req.body
        if (!itemDescriptor) throw new BadRequest('Invalid item descriptor')
        if (!DESCRIPTOR_REGEX().test(itemDescriptor)) throw new BadRequest('Invalid descriptor')
        const quantity = req.body.quantity || '1'
        if (!isNaN(parseInt(quantity))) throw new BadRequest('Invalid quantity')
        await LobbyService.addItemToCharacter(lobby_id, characterDescriptor, itemDescriptor, quantity)
        res.status(200).json({ message: 'ok', characterDescriptor, itemDescriptor, quantity })
    }

    public async addAttributeToCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor: characterDescriptor } = LobbyWithDescriptorSchema.parse(req.params)
        const attributeSchema = new Schema({
            dlc: 'string',
            descriptor: 'string',
            value: 'number',
        })
        const validation = attributeSchema.check(req.body)
        if (!validation.success) {
            throw new BadRequest(validation.type, {
                reason: validation.message,
            })
        }
        const { dlc, descriptor: attributeDescriptor, value } = validation.value
        if (!DESCRIPTOR_REGEX().test(`${dlc}:${attributeDescriptor}`)) throw new BadRequest('Invalid descriptor')
        await LobbyService.addAttributeToCharacter(lobby_id, characterDescriptor, dlc, attributeDescriptor, value)
        res.status(200).json({ message: 'ok', characterDescriptor, dlc, attributeDescriptor, value })
    }

    public async updateCharacter(req: Request, res: Response): Promise<void> {
        const { lobby_id, descriptor } = LobbyWithDescriptorSchema.parse(req.params)
        const lobby = await DatabaseService.getLobby(lobby_id)
        const user = AuthService.verifyAuthorizationHeader(req.headers.authorization)
        if (!lobby) throw new NotFound('Lobby not found')
        if (lobby.gm_id !== user._id) throw new Forbidden('You are not the GM of this lobby')

        const validation = CharacterSchema.check(req.body)

        if (!validation.success) {
            throw new BadRequest(validation.type, {
                reason: validation.type === 'CALLBACK_FAILED' ? 'Invalid character data' : validation.message,
            })
        }
        const value = validation.value

        const NewCharacterClass = {
            ...value,
        } as EntityInfoFullToCharacterClass
        await DatabaseService.updateCharacter(lobby_id, descriptor, NewCharacterClass)
        res.status(200).json({ message: 'ok', descriptor })
    }

    public onConnection(socket: Socket): void {
        const query = socket.handshake.query
        const combatId = typeof query.combatId === 'string' ? query.combatId : undefined
        const userToken = typeof query.userToken === 'string' ? query.userToken : undefined

        if (!(combatId && userToken)) {
            socket.disconnect()
            return
        }

        console.log('Trying to establish connection: ', combatId, userToken)
        LobbyService.manageSocket(socket, combatId as string, userToken as string)
    }
}

export default new LobbyController()
