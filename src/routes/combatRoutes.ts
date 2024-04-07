import { Router } from 'express'
import DatabaseService from '../services/DatabaseService'

const router = Router()

router.post('/create', async (req, res) => {
    console.log('Adding combat')
    const { field } = req.body
    const preset_id = await DatabaseService.createNewCombatPreset(field)
    res.send({ result: 'ok', preset_id })
})

export default router
