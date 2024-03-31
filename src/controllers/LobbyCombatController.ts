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

    public async getLobbyInfo(req: Request, res: Response): Promise<void> {
        const { lobby_id } = req.params
        const lobby = await getLobby(lobby_id)
        if (!lobby) {
            res.json({ message: 'Lobby not found!', code: 404 })
            return
        }
        const combatInfo = []
        const combats = this.active_games.get(lobby_id)
        if (combats) {
            for (const [nickname, combat] of combats) {
                combatInfo.push({
                    nickname,
                    isActive: combat.isActive(),
                    roundCount: combat.isActive() ? combat.getRoundCount() : 0,
                })
            }
        }
        res.json({ combats: combatInfo || [], gm: lobby.gm_id, players: lobby.players })
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
        if (!lobby) {
            res.json({ message: 'error', code: 404 })
            return
        }
        this.active_games.set(lobby_id, this.active_games.get(lobby_id) || new Map())
        const lobby_combats = this.active_games.get(lobby_id)
        if (lobby_combats) {
            const removeSelf = () => lobby_combats.delete(combatNickname)
            lobby_combats.set(
                combatNickname,
                new LobbyCombat(
                    combatPreset,
                    removeSelf,
                    lobby.gm_id,
                    lobby.players.map((player) => player.nickname) || []
                )
            )
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
