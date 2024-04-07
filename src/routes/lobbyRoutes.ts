import { Router } from 'express'
import LobbyCombatController from '../controllers/LobbyCombatController'
import DatabaseService from '../services/DatabaseService'

const router = Router()

router.post('/create', async (req, res) => {
    console.log('Creating lobby. Params:', req.body)
    const { lobby_name, gm_id } = req.body
    const lobby_id = await DatabaseService.createNewLobby(lobby_name, gm_id)
    console.log('Lobby created', lobby_id)
    res.json({ result: 'ok', lobby_id })
})

router.patch('/:lobby_id/add_player', async (req, res) => {
    console.log('Adding player to lobby. Params:', req.body)
    const { lobby_id } = req.params
    const { player_id, nickname, mainCharacter } = req.body
    await DatabaseService.addPlayerToLobby(lobby_id, player_id, nickname, mainCharacter)
    res.json({ result: 'ok', player_id })
})

router.get('/:lobby_id', LobbyCombatController.getLobbyInfo.bind(LobbyCombatController))
router.post('/:lobby_id/create_combat', LobbyCombatController.createLobbyCombat.bind(LobbyCombatController))
router.post('/:lobby_id/', LobbyCombatController.getAllNicknames.bind(LobbyCombatController))

export default router
