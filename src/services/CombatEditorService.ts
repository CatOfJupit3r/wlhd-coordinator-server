import DatabaseService from './DatabaseService'

class CombatEditorService {
    async createCombatPreset(field: any) {
        return await DatabaseService.createNewCombatPreset(field)
    }
}

export default new CombatEditorService()
