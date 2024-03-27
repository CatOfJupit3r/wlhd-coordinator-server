import { Request, Response } from 'express'
import { getLobby } from '../services/DatabaseService'
import { LobbyCombat } from '../services/LobbyCombat'

export class LobbyCombatController {
    private active_games: Map<
        string, // lobbies
        Map<string, LobbyCombat> // combats in lobby
    >

    constructor() {
        this.active_games = new Map()
    }

    public getLobbyCombats(req: Request, res: Response): void {
        const { lobby_id } = req.params
        const combats = this.active_games.get(lobby_id)
        res.json({ combats })
    }

    public async createLobbyCombat(req: Request, res: Response): Promise<void> {
        const { lobby_id } = req.params
        const combatPreset: string = req.body.combat_preset
        const combatNickname: string = req.body.combat_nickname

        if (!lobby_id || !combatPreset || !combatNickname) {
            res.json({ message: 'error', code: 400 })
            return
        }
        const lobby = await getLobby(lobby_id)
        this.active_games.set(lobby_id, this.active_games.get(lobby_id) || new Map())
        const lobby_combats = this.active_games.get(lobby_id)
        if (lobby_combats) {
            const removeSelf = () => lobby_combats.delete(combatNickname)
            // lobby_combats.set(combatNickname, new LobbyCombat(combatPreset, removeSelf))
            res.json({ message: 'ok', code: 200 })
        } else {
            res.json({ message: 'error', code: 500 })
        }
    }

    public getAllNicknames(req: Request, res: Response): void {
        const { lobby_id } = req.params
        const combats = this.active_games.get(lobby_id)
        if (!combats) {
            res.json({ message: 'error', code: 404 })
            return
        }
        res.json({ nicknames: Array.from(combats.keys()) })
    }
}
