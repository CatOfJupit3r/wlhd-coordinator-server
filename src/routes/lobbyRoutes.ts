import { Router } from 'express'
import LobbyCombatController from '../controllers/LobbyCombatController'
import { authenticationMiddleware } from '../middleware/AuthenticationMiddleware'
import { CharacterInfo } from '../models/InfoModels'
import { EntityClass } from '../models/entityModel'
import { LobbyClass } from '../models/lobbyModel'
import AuthService from '../services/AuthService'
import DatabaseService from '../services/DatabaseService'

const router = Router()

router.post('/create', async (req, res) => {
    console.log('Creating lobby. Params:', req.body)
    const { lobbyName, gm_id } = req.body
    const lobby_id = await DatabaseService.createNewLobby(lobbyName, gm_id)
    console.log('Lobby created', lobby_id)
    res.json({ result: 'ok', lobby_id })
})

router.patch('/:lobby_id/add_player', authenticationMiddleware, async (req, res) => {
    console.log('Adding player to lobby. Params:', req.body)
    const { lobby_id } = req.params
    const { player_id, nickname, mainCharacter } = req.body
    await DatabaseService.addPlayerToLobby(lobby_id, player_id, nickname, mainCharacter)
    res.json({ result: 'ok', player_id })
})

const parseEntityClass = (character: EntityClass, lobby: LobbyClass, character_id: string | null): CharacterInfo => {
    let new_obj: { [key: string]: any } = {}
    for (const [key, atr] of Object.entries(character.attributes)) {
        if (key !== '_doc') continue
        new_obj = { ...atr, _id: undefined }
    }
    console.log(new_obj)
    return {
        ...(character as any)._doc,
        attributes: {
            ...Object.entries(new_obj).reduce((acc: { [key: string]: string }, [key, value]) => {
                acc[`builtins:${key}`] = String(value) // Convert number to string
                return acc
            }, {}),
            ...character.customAttributes.reduce((acc: { [key: string]: string }, value: any) => {
                acc[`${value.dlc}:${value.descriptor}`] = String(value.value) // Convert number to string
                return acc
            }, {}),
        },
        controlledBy: character_id ? lobby.players.find((p) => p.mainCharacter === character_id)?.userId || null : null,
    }
}

router.get('/:lobby_id/my_character', authenticationMiddleware, async (req, res) => {
    console.log('Getting my character info')
    const { lobby_id } = req.params
    if (!req.headers.authorization) {
        res.json({ error: 'No authorization header' })
        return
    }
    const player_id = AuthService.verifyAccessToken(AuthService.removeBearerPrefix(req.headers.authorization))
    // we get lobby players, then we find player with player_id, then we get his character
    const lobby = await DatabaseService.getLobby(lobby_id)
    if (!lobby) {
        res.status(404).json({ error: 'Lobby not found' })
        return
    }
    const player = lobby.players.find((p) => p.userId === player_id._id)
    if (!player) {
        res.status(404).json({ error: 'Player not found' })
        return
    } else if (!player.mainCharacter) {
        res.status(404).json({ error: 'Player has no character' })
        return
    }
    try {
        const character = await DatabaseService.getCharacterInfo(player.mainCharacter)
        res.json(parseEntityClass(character, lobby, player.mainCharacter))
    } catch (error: any) {
        console.log('Error getting my character info:', error)
        res.status(500).json({ error: error.message })
    }
})

router.get('/:lobby_id/character/:character_id', authenticationMiddleware, async (req, res) => {
    console.log('Getting character info')
    const { lobby_id, character_id } = req.params
    const lobby = await DatabaseService.getLobby(lobby_id)
    if (!lobby) {
        res.json({ error: 'Lobby not found' })
        return
    }
    try {
        const character = await DatabaseService.getCharacterInfo(character_id)
        res.json(parseEntityClass(character, lobby, character_id))
    } catch (error: any) {
        console.log('Error getting character info:', error)
        res.json({ error: error.message })
        return
    }
})

router.patch('/:lobby_id/assign_character', authenticationMiddleware, async (req, res) => {
    console.log('Assigning character to player. Params:', req.body)
    const { lobby_id } = req.params
    const { player_id, character_id } = req.body
    await DatabaseService.assignCharacterToPlayer(lobby_id, player_id, character_id)
    res.json({ result: 'ok' })
})

router.get('/:lobby_id', authenticationMiddleware, LobbyCombatController.getLobbyInfo.bind(LobbyCombatController))
router.post(
    '/:lobby_id/create_combat',
    authenticationMiddleware,
    LobbyCombatController.createLobbyCombat.bind(LobbyCombatController)
)
router.post('/:lobby_id/', authenticationMiddleware, LobbyCombatController.getAllNicknames.bind(LobbyCombatController))

export default router
