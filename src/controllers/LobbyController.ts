import { DESCRIPTOR_NO_DLC_REGEX, DESCRIPTOR_REGEX } from '@config/regex'
import { createRouteInController } from '@controllers/RouteInController'
import { BadRequest, Forbidden, InternalServerError, NotFound } from '@models/ErrorModels'
import { CharacterInfoFullToCharacterClass } from '@models/GameEditorModels'
import { AttributeInfo } from '@models/ServerModels'
import { DescriptorZodString } from '@schemas/CombatEditorSchemas'
import CombatSaveZod from '@schemas/CombatSaveSchema'
import { CharacterSchema } from '@schemas/LobbyControllerSchemas'
import AuthService from '@services/AuthService'
import DatabaseService from '@services/DatabaseService'
import LobbyService from '@services/LobbyService'
import { RandomUtils } from '@utils'
import { Request, Response } from 'express'
import { Types } from 'mongoose'
import { Socket } from 'socket.io'
import { z } from 'zod'

const CreateGameLobbySchema = z
    .object({
        nickname: z.string().min(1).max(20).optional(), // if none provided, will be generated
        preset: CombatSaveZod,
    })
    .strict()

const LobbyIdSchema = z.object({
    lobby_id: z.string().refine((value) => Types.ObjectId.isValid(value), { message: 'Invalid lobby_id' }),
})

const DescriptorInPathSchema = z.object({
    descriptor: z.string().regex(DESCRIPTOR_NO_DLC_REGEX()),
})

const PlayerIdSchema = z.object({
    player_id: z.string().refine((value) => Types.ObjectId.isValid(value), { message: 'Invalid player_id' }),
})

const LobbyIdWithDescriptorSchema = z.object({}).merge(LobbyIdSchema).merge(DescriptorInPathSchema)

class LobbyController {
    getCustomTranslations = createRouteInController(
        async (req: Request, res: Response) => {
            const { lobby_id } = req.params
            const user = AuthService.verifyAuthorizationHeader(req.headers.authorization)
            const translations = await LobbyService.getCustomTranslations(lobby_id, user._id)
            res.status(200).json(translations)
        },
        {
            params: LobbyIdSchema,
        }
    )

    createNewLobby = createRouteInController(
        async (req: Request, res: Response) => {
            const { lobbyName, gm_id } = req.body
            const lobby_id = await LobbyService.createNewLobby(lobbyName, gm_id)
            console.log('Lobby created', lobby_id)
            res.status(200).json({ result: 'ok', lobby_id })
        },
        {
            body: z.object({
                lobbyName: z.string(),
                gm_id: z.string().refine((value) => Types.ObjectId.isValid(value), { message: 'Invalid gm_id' }),
            }),
        }
    )

    addPlayerToLobby = createRouteInController(
        async (req: Request, res: Response) => {
            const { lobby_id } = req.params
            const { player_id, nickname } = req.body
            await LobbyService.addPlayerToLobby(lobby_id, player_id, nickname)
            res.status(200).json({ result: 'ok', player_id })
        },
        {
            params: LobbyIdSchema,
            body: z.object({
                player_id: z
                    .string()
                    .refine((value) => Types.ObjectId.isValid(value), { message: 'Invalid player_id' }),
                nickname: z.string(),
            }),
        }
    )

    getLobbyInfo = createRouteInController(
        async (req: Request, res: Response) => {
            const { lobby_id } = req.params
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
        },
        {
            params: LobbyIdSchema,
        }
    )

    createCombatForLobby = createRouteInController(
        async (req: Request, res: Response) => {
            const { lobby_id } = req.params

            const { nickname, preset } = req.body

            const lobby = await DatabaseService.getLobby(lobby_id)
            if (!lobby) throw new NotFound('Lobby not found')
            const combat_id = LobbyService.createCombat(
                lobby_id,
                nickname ?? RandomUtils.generateRandomString(8),
                preset,
                lobby.gm_id,
                lobby.players.map((player) => player.userId)
            )
            if (combat_id) {
                res.status(200).json({ message: 'ok', combat_id })
            } else throw new InternalServerError('Failed to create combat')
        },
        {
            params: LobbyIdSchema,
            body: CreateGameLobbySchema,
        }
    )

    assignCharacterToPlayer = createRouteInController(
        async (req: Request, res: Response) => {
            const { lobby_id, descriptor } = req.params
            const { player_id } = req.body
            await DatabaseService.assignCharacterToPlayer(lobby_id, player_id, descriptor)
            res.status(200).json({ message: 'ok', player_id, descriptor })
        },
        {
            params: LobbyIdWithDescriptorSchema,
            body: PlayerIdSchema,
        }
    )

    removeCharacterFromPlayer = createRouteInController(
        async (req: Request, res: Response) => {
            const { lobby_id, descriptor } = req.params
            const { player_id } = req.body
            await DatabaseService.removeCharacterFromPlayer(lobby_id, player_id, descriptor)
            res.status(200).json({ message: 'ok', player_id, descriptor })
        },
        {
            params: LobbyIdWithDescriptorSchema,
            body: PlayerIdSchema,
        }
    )

    getMyCharacterInfo = createRouteInController(
        async (req: Request, res: Response) => {
            const { lobby_id } = req.params
            const user = AuthService.verifyAuthorizationHeader(req.headers.authorization)
            const characters = await LobbyService.getMyCharactersInfo(lobby_id, user._id)
            res.status(200).json({
                characters,
            })
        },
        {
            params: LobbyIdSchema,
        }
    )

    getCharacterInfo = createRouteInController(
        async (req: Request, res: Response) => {
            const { lobby_id, descriptor } = req.params
            const user = AuthService.verifyAuthorizationHeader(req.headers.authorization)
            const characterInfo = await LobbyService.getCharacterInfo(lobby_id, user._id, descriptor)
            res.status(200).json(characterInfo)
        },
        {
            params: LobbyIdWithDescriptorSchema,
        }
    )

    createCharacter = createRouteInController(
        async (req: Request, res: Response) => {
            const { lobby_id } = req.params
            const { descriptor, decorations, attributes, controlledBy } = req.body

            await LobbyService.createNewCharacter(lobby_id, controlledBy ?? [], descriptor, decorations, attributes)
            res.status(200).json({ result: 'ok', descriptor })
        },
        {
            params: LobbyIdSchema,
            body: z.object({
                descriptor: z.string(), // this descriptor does not have dlc tag, because it will be assigned to `coordinator` dlc
                decorations: z.object({
                    name: z.string(),
                    description: z.string(),
                    sprite: z.string(),
                }),
                attributes: z.array(
                    z.object({
                        descriptor: DescriptorZodString,
                        value: z.number(),
                    })
                ),
                controlledBy: z.array(z.string()).optional(),
            }),
        }
    )

    deleteCharacter = createRouteInController(
        async (req: Request, res: Response) => {
            const { lobby_id, descriptor } = req.params
            await LobbyService.deleteCharacter(lobby_id, descriptor)
            res.status(200).json({ message: 'ok', descriptor })
        },
        {
            params: LobbyIdWithDescriptorSchema,
        }
    )

    getWeaponryOfCharacter = createRouteInController(
        async (req: Request, res: Response) => {
            const { lobby_id, descriptor } = req.params
            res.status(200).json({
                weaponry: await LobbyService.getWeaponryOfCharacter(lobby_id, descriptor),
            })
        },
        {
            params: LobbyIdWithDescriptorSchema,
        }
    )

    getInventoryOfCharacter = createRouteInController(
        async (req: Request, res: Response) => {
            const { lobby_id, descriptor } = req.params
            res.status(200).json({
                inventory: await LobbyService.getInventoryOfCharacter(lobby_id, descriptor),
            })
        },
        {
            params: LobbyIdWithDescriptorSchema,
        }
    )

    getSpellbookOfCharacter = createRouteInController(
        async (req: Request, res: Response) => {
            const { lobby_id, descriptor } = req.params
            res.status(200).json({
                spells: await LobbyService.getSpellbookOfCharacter(lobby_id, descriptor),
            })
        },
        {
            params: LobbyIdWithDescriptorSchema,
        }
    )

    getStatusEffectsOfCharacter = createRouteInController(
        async (req: Request, res: Response) => {
            const { lobby_id, descriptor } = req.params
            res.status(200).json({
                status_effects: await LobbyService.getStatusEffectsOfCharacter(lobby_id, descriptor),
            })
        },
        {
            params: LobbyIdWithDescriptorSchema,
        }
    )

    getAttributesOfCharacter = createRouteInController(
        async (req: Request, res: Response) => {
            const { lobby_id, descriptor } = req.params
            res.status(200).json({
                attributes: await LobbyService.getAttributesOfCharacter(lobby_id, descriptor),
            } as { attributes: AttributeInfo })
        },
        {
            params: LobbyIdWithDescriptorSchema,
        }
    )

    addWeaponToCharacter = createRouteInController(
        async (req: Request, res: Response) => {
            const { lobby_id, descriptor: characterDescriptor } = req.params
            const { descriptor: weaponDescriptor } = req.body

            const quantity = req.body.quantity || 1
            await LobbyService.addWeaponToCharacter(lobby_id, characterDescriptor, weaponDescriptor, quantity)

            res.status(200).json({ message: 'ok', characterDescriptor, weaponDescriptor, quantity })
        },
        {
            params: LobbyIdWithDescriptorSchema,
            body: z.object({
                descriptor: DescriptorZodString,
                quantity: z.number().min(1).optional(),
            }),
        }
    )

    addSpellToCharacter = createRouteInController(
        async (req: Request, res: Response) => {
            const { lobby_id, descriptor: characterDescriptor } = req.params

            const { descriptor: spellDescriptor } = req.body
            await LobbyService.addSpellToCharacter(lobby_id, characterDescriptor, spellDescriptor)
            res.status(200).json({ message: 'ok', characterDescriptor, spellDescriptor })
        },
        {
            params: LobbyIdWithDescriptorSchema,
            body: z.object({
                descriptor: DescriptorZodString,
            }),
        }
    )

    addStatusEffectToCharacter = createRouteInController(
        async (req: Request, res: Response) => {
            const { lobby_id, descriptor: characterDescriptor } = req.params
            const { descriptor: effectDescriptor, duration } = req.body
            await LobbyService.addStatusEffectToCharacter(lobby_id, characterDescriptor, effectDescriptor, duration)
            res.status(200).json({ message: 'ok', characterDescriptor, effectDescriptor, duration })
        },
        {
            params: LobbyIdWithDescriptorSchema,
            body: z.object({
                descriptor: DescriptorZodString,
                duration: z.number().min(1),
            }),
        }
    )

    addItemToCharacter = createRouteInController(
        async (req: Request, res: Response) => {
            const { lobby_id, descriptor: characterDescriptor } = req.params
            const { descriptor: itemDescriptor } = req.body
            const quantity = req.body.quantity || 1
            await LobbyService.addItemToCharacter(lobby_id, characterDescriptor, itemDescriptor, quantity)
            res.status(200).json({ message: 'ok', characterDescriptor, itemDescriptor, quantity })
        },
        {
            params: LobbyIdWithDescriptorSchema,
            body: z.object({
                descriptor: DescriptorZodString,
                quantity: z.number().min(1).optional(),
            }),
        }
    )

    addAttributeToCharacter = createRouteInController(
        async (req: Request, res: Response) => {
            const { lobby_id, descriptor: characterDescriptor } = req.params
            const { dlc, descriptor: attributeDescriptor, value } = req.body
            if (!DESCRIPTOR_REGEX().test(`${dlc}:${attributeDescriptor}`)) throw new BadRequest('Invalid descriptor')
            await LobbyService.addAttributeToCharacter(lobby_id, characterDescriptor, dlc, attributeDescriptor, value)
            res.status(200).json({ message: 'ok', characterDescriptor, dlc, attributeDescriptor, value })
        },
        {
            params: LobbyIdWithDescriptorSchema,
            body: z.object({
                descriptor: DescriptorZodString,
                value: z.number(),
            }),
        }
    )

    updateCharacter = createRouteInController(
        async (req: Request, res: Response) => {
            const { lobby_id, descriptor } = req.params
            const lobby = await DatabaseService.getLobby(lobby_id)
            const user = AuthService.verifyAuthorizationHeader(req.headers.authorization)
            if (!lobby) throw new NotFound('Lobby not found')
            if (lobby.gm_id !== user._id) throw new Forbidden('You are not the GM of this lobby')

            const NewCharacterClass = {
                ...req.body,
            } as CharacterInfoFullToCharacterClass
            await DatabaseService.updateCharacter(lobby_id, descriptor, NewCharacterClass)
            res.status(200).json({ message: 'ok', descriptor })
        },
        {
            params: LobbyIdWithDescriptorSchema,
            body: CharacterSchema,
        }
    )

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
