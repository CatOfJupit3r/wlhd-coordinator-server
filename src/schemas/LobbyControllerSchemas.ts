import { ExtendedSchema } from 'just-enough-schemas'
import { Types } from 'mongoose'
import { DESCRIPTOR_NO_DLC_REGEX } from '../configs'
import { EntityInfoFullToCharacterClass } from '../models/GameEditorModels'

const LobbySchemaBuilder = () => {
    const lobbySchema = new ExtendedSchema<{ lobby_id: string }>({ excess: 'clean' })
    lobbySchema.addStringField('lobby_id', {
        callback: (value: string) => {
            return Types.ObjectId.isValid(value)
        },
    })
    return lobbySchema
}

const LobbyWithDescriptorBuilder = () => {
    const lobbyWithDescriptorSchema = new ExtendedSchema<{ lobby_id: string; descriptor: string }>({ excess: 'clean' })
    lobbyWithDescriptorSchema.addStringField('lobby_id', {
        callback: (value: string) => {
            return Types.ObjectId.isValid(value)
        },
    })
    lobbyWithDescriptorSchema.addRegexField('descriptor', DESCRIPTOR_NO_DLC_REGEX())

    return lobbyWithDescriptorSchema
}

// CHARACTER SCHEMA

const CharacterSchemaBuilder = () => {
    const characterSchema = new ExtendedSchema<EntityInfoFullToCharacterClass>({ excess: 'forbid' })

    const decorationSchema = new ExtendedSchema<EntityInfoFullToCharacterClass['decorations']>({ excess: 'forbid' })
    decorationSchema.addStringField('name')
    decorationSchema.addStringField('description')
    decorationSchema.addStringField('sprite')

    characterSchema.addExtendedSchemaField('decorations', decorationSchema)

    const attributeSchema = new ExtendedSchema<EntityInfoFullToCharacterClass['attributes'][number]>({
        excess: 'forbid',
    })
    attributeSchema.addStringField('descriptor')
    attributeSchema.addNumberField('value')

    characterSchema.addArrayOfElementsField('attributes', attributeSchema)

    const spellBookSchema = new ExtendedSchema<EntityInfoFullToCharacterClass['spellBook']>({ excess: 'forbid' })
    spellBookSchema.addNumberField('maxActiveSpells')
    const knownSpellsSchema = new ExtendedSchema<EntityInfoFullToCharacterClass['spellBook']['knownSpells'][number]>({
        excess: 'forbid',
    })
    knownSpellsSchema.addStringField('descriptor')
    knownSpellsSchema.addBooleanField('isActive')
    spellBookSchema.addArrayOfElementsField('knownSpells', knownSpellsSchema)

    characterSchema.addExtendedSchemaField('spellBook', spellBookSchema)

    const inventorySchema = new ExtendedSchema<EntityInfoFullToCharacterClass['inventory'][number]>({
        excess: 'forbid',
    })
    inventorySchema.addStringField('descriptor')
    inventorySchema.addNumberField('quantity')

    characterSchema.addArrayOfElementsField('inventory', inventorySchema)

    const statusEffectsSchema = new ExtendedSchema<EntityInfoFullToCharacterClass['statusEffects'][number]>({
        excess: 'forbid',
    })
    statusEffectsSchema.addStringField('descriptor')
    statusEffectsSchema.addNumberField('duration')

    characterSchema.addArrayOfElementsField('statusEffects', statusEffectsSchema)

    const weaponrySchema = new ExtendedSchema<EntityInfoFullToCharacterClass['weaponry'][number]>({
        excess: 'forbid',
    })
    weaponrySchema.addStringField('descriptor')
    weaponrySchema.addNumberField('quantity')

    characterSchema.addArrayOfElementsField('weaponry', weaponrySchema)

    return characterSchema
}

const CharacterSchema = CharacterSchemaBuilder()
const LobbySchema = LobbySchemaBuilder()
const LobbyWithDescriptorSchema = LobbyWithDescriptorBuilder()

export { CharacterSchema, LobbySchema, LobbyWithDescriptorSchema }
