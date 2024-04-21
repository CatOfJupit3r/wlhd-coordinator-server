import DatabaseService from './DatabaseService'

class EntityEditorService {
    async createNewEntity(descriptor: string, attributes: any, customAttributes: any) {
        return await DatabaseService.createNewEntity(descriptor, attributes, customAttributes)
    }
}

export default new EntityEditorService()
