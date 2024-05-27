import { CombatConnection } from './CombatConnection'
import DatabaseService from './DatabaseService'

class CombatManager {
    private combats: Map<string, CombatConnection> = new Map()
    private managedSoFar: number = 0

    public get(combat_id: string): CombatConnection | undefined {
        return this.combats.get(combat_id)
    }

    public createCombat(
        combatNickname: string,
        preset: any,
        gm_id: string,
        players: string[],
        onDeleted: () => void
    ): string {
        const combat_id = (this.managedSoFar++).toString()
        const removeSelf = () => {
            this.combats.delete(combat_id)
            onDeleted()
        }
        this.combats.set(combat_id, new CombatConnection(combatNickname, preset, removeSelf, gm_id, players))
        console.log('Combat created', combat_id)
        return combat_id
    }

    public async getPlayersInCombat(combat: CombatConnection): Promise<string[]> {
        if (!combat) return []
        const playerIDs: Array<string> = combat.getActivePlayers()
        const players = []
        for (const id of playerIDs) {
            const player = await DatabaseService.getUser(id)
            if (player) players.push(player.handle)
        }
        return players
    }
}

export default new CombatManager()
