import { Router } from 'express'
import { LobbyCombatController } from '../controllers/LobbyCombatController'
import { addPlayerToLobby, createNewLobby } from '../services/DatabaseService'

const router = Router()
const lobbyCombatController = new LobbyCombatController()

router.post('/create', async (req, res) => {
    console.log('Creating lobby. Params:', req.body)
    const { lobby_name, gm_id } = req.body
    const lobby_id = await createNewLobby(lobby_name, gm_id)
    console.log('Lobby created', lobby_id)
    res.json({ result: 'ok', lobby_id })
})

router.patch('/:lobby_id/add_player', async (req, res) => {
    console.log('Adding player to lobby. Params:', req.body)
    const { lobby_id } = req.params
    const { player_id, nickname, mainCharacter } = req.body
    await addPlayerToLobby(lobby_id, player_id, nickname, mainCharacter)
    res.json({ result: 'ok', player_id })
})

router.get('/:lobby_id', lobbyCombatController.getLobbyInfo.bind(lobbyCombatController))
router.post('/:lobby_id/create_combat', lobbyCombatController.createLobbyCombat.bind(lobbyCombatController))
router.post('/:lobby_id/', lobbyCombatController.getAllNicknames.bind(lobbyCombatController))

export default router
