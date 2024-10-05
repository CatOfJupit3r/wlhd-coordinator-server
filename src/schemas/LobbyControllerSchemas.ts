import { z } from 'zod'
import { ComponentMemoryZod } from './CombatSaveSchema' // CHARACTER SCHEMA

// CHARACTER SCHEMA

const CharacterSchema = z.object({
    decorations: z.object({
        name: z.string(),
        description: z.string(),
        sprite: z.string(),
    }),

    attributes: z.record(z.string(), z.number()),
    states: z.record(z.string(), z.number()),

    statusEffects: z.array(
        z.object({
            descriptor: z.string(),
            duration: z.number().nullable(),
        })
    ),

    inventory: z.array(
        z.object({
            descriptor: z.string(),
            quantity: z.number(),
        })
    ),

    weaponry: z.array(
        z.object({
            descriptor: z.string(),
            quantity: z.number(),
        })
    ),

    spellBook: z.object({
        knownSpells: z.array(
            z.object({
                descriptor: z.string(),
                isActive: z.boolean(),
            })
        ),
        maxActiveSpells: z.number().nullable(),
    }),

    memory: ComponentMemoryZod.optional(),

    tags: z.array(z.string()),
})

export { CharacterSchema }
