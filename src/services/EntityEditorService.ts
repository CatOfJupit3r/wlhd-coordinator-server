import DatabaseService from './DatabaseService'

class EntityEditorService {
    async createNewEntity(
        descriptor: string,
        decorations: {
            name: string
            description: string
            sprite: string
        },
        attributes: any,
        customAttributes: any
    ) {
        return await DatabaseService.createNewEntity(descriptor, decorations, attributes, customAttributes)
    }
}

export default new EntityEditorService()
