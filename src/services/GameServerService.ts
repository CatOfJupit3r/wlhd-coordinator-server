import DatabaseService from './DatabaseService'

class GameServerService {
    async createCombatPreset(field: any) {
        return await DatabaseService.createNewCombatPreset(field)
    }
}

export default new GameServerService()
