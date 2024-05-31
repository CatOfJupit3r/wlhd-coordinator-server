import { AttributeClass } from '../models/TypegooseModels'
import DatabaseService from './DatabaseService'

class CharacterEditorService {
    async createNewEntity(
        descriptor: string,
        decorations: {
            name: string
            description: string
            sprite: string
        },
        attributes: Array<AttributeClass>
    ) {
        return await DatabaseService.createNewCharacter(descriptor, decorations, attributes)
    }
}

export default new CharacterEditorService()
