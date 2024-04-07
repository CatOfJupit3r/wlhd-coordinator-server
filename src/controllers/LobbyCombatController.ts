import { Request, Response } from 'express'
import { Socket } from 'socket.io'
import AuthService from '../services/AuthService'
import DatabaseService from '../services/DatabaseService'
import { LobbyCombatService } from '../services/LobbyCombatService'
import { getEmittableCombatPreset } from '../utils/getEmittableCombatPreset'

class LobbyCombatController {
    private active_games: Map<
        string, // lobbies
        Map<string, LobbyCombatService> // combats in lobby
    >

    constructor() {
        this.active_games = new Map()
    }

    public async getLobbyInfo(req: Request, res: Response): Promise<void> {
        const { lobby_id } = req.params
        const lobby = await DatabaseService.getLobby(lobby_id)
        if (!lobby) {
            res.json({ message: 'Lobby not found!', code: 404 })
            return
        }
        const combatInfo = []
        const combats = this.active_games.get(lobby_id)
        console.log('Lobby:', lobby, 'Combats:', combats)
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
        console.log('Creating lobby combat. Params:', req.body)
        const { lobby_id } = req.params
        const combatPreset: string = req.body.combat_preset
        const combatNickname: string = req.body.combat_nickname

        if (!lobby_id || !combatPreset || !combatNickname) {
            res.json({ message: 'error', code: 400 })
            return
        }
        const lobby = await DatabaseService.getLobby(lobby_id)
        if (!lobby) {
            res.json({ message: 'error', code: 404 })
            return
        }
        const preset = await getEmittableCombatPreset(combatPreset)
        if (!preset) {
            res.json({ message: 'error', code: 404 })
            return
        }
        this.active_games.set(lobby_id, this.active_games.get(lobby_id) || new Map())
        const lobby_combats = this.active_games.get(lobby_id)
        if (lobby_combats) {
            const combatId = (lobby_combats.size + 1).toString() // is this good?..
            const removeSelf = () => lobby_combats.delete(combatId)
            lobby_combats.set(
                combatId,
                new LobbyCombatService(
                    combatNickname,
                    preset,
                    removeSelf,
                    lobby.gm_id,
                    lobby.players.map((player) => player.userId) || []
                )
            )
            console.log('Combat created', combatId)
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

    public manageSocket(socket: Socket, lobby_id: string, combat_id: string, userToken: string): void {
        const lobby = this.active_games.get(lobby_id)
        if (!lobby) {
            return this.disconnectSocket(socket)
        }
        const combat = lobby.get(combat_id)
        if (!combat) {
            return this.disconnectSocket(socket)
        }
        const { _id } = AuthService.verifyAccessToken(userToken)
        if (combat.isPlayerInCombat(_id)) {
            return this.disconnectSocket(socket)
        }
        combat.manageSocket(_id, socket)
    }

    private disconnectSocket(socket: Socket): void {
        socket.disconnect()
    }
}

export default new LobbyCombatController()
