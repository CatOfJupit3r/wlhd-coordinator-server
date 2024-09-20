import { CombatSaveType } from '@schemas/CombatSaveSchema'
import { CombatConnection } from './CombatConnection'

class CombatManager {
    private combats: Map<string, CombatConnection> = new Map()
    private managedSoFar: number = 0

    public get(combat_id: string): CombatConnection | undefined {
        return this.combats.get(combat_id)
    }

    public createCombat(
        nickname: string,
        preset: CombatSaveType,
        gm_id: string,
        players: string[],
        onDeleted: () => void
    ): string {
        const combat_id = (this.managedSoFar++).toString()
        const removeSelf = () => {
            this.combats.delete(combat_id)
            onDeleted()
        }
        this.combats.set(combat_id, new CombatConnection(nickname, preset, removeSelf, gm_id, players))
        console.log('Combat created', combat_id)
        return combat_id
    }

    public async getPlayersInCombat(combat: CombatConnection): Promise<string[]> {
        if (!combat) return []
        return combat.getActivePlayers()
    }
}

export default new CombatManager()
