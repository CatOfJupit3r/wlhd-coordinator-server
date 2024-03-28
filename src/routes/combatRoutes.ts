import { Router } from 'express'

const router = Router()

router.post('/combats/add_combat', async (req, res) => {
    res.json({ result: 'ok' })
})

export default router
