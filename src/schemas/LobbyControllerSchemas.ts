import { DESCRIPTOR_NO_DLC_REGEX } from '@configs'
import { EntityInfoFullToCharacterClass } from '@models/GameEditorModels'
import { ExtendedSchema } from 'just-enough-schemas'
import { Types } from 'mongoose'
import { z } from 'zod'
import CombatSaveZod from './CombatSaveSchema'

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
    spellBookSchema.addNullableField('maxActiveSpells', ['number'])
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
    statusEffectsSchema.addNullableField('duration', ['number'])

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

const LobbySchema = z
    .object({
        lobby_id: z.string().refine((value) => Types.ObjectId.isValid(value), {
            message: 'lobby_id is not a valid ObjectId',
        }),
    })
    .strip()

const LobbyWithDescriptorSchema = z
    .object({
        descriptor: z.string().regex(DESCRIPTOR_NO_DLC_REGEX()),
    })
    .merge(LobbySchema)
    .strip()

const CreateGameLobbySchema = z
    .object({
        nickname: z.string().min(1).max(20).optional(), // if none provided, will be generated
        preset: CombatSaveZod,
    })
    .strict()

export { CharacterSchema, CreateGameLobbySchema, LobbySchema, LobbyWithDescriptorSchema }
