import { z } from 'zod'
import { DESCRIPTOR_REGEX } from '../configs'

// COMBAT PRESET SCHEMA

const CombatEditorSchema = z.object({
    nickName: z.string(),
    battlefield: z.record(
        z.object({
            descriptor: z.string().regex(DESCRIPTOR_REGEX()),
            control: z
                .object({
                    type: z.enum(['player', 'ai', 'game_logic']),
                    id: z.string().optional(),
                })
                .refine((value) => {
                    return !((value.type === 'player' || value.type === 'ai') && !value.id)
                }),
            character: z.object({
                decorations: z.object({
                    name: z.string(),
                    description: z.string(),
                    sprite: z.string(),
                }),
                attributes: z.record(z.number()),
                spellBook: z.object({
                    maxActiveSpells: z.number().nullable(),
                    knownSpells: z.array(
                        z.object({
                            descriptor: z.string().regex(DESCRIPTOR_REGEX()),
                            turns_until_usage: z.number().min(0),
                            current_consecutive_uses: z.number().min(0),
                            is_active: z.boolean(),
                        })
                    ),
                }),
                inventory: z.array(
                    z.object({
                        descriptor: z.string().regex(DESCRIPTOR_REGEX()),
                        quantity: z.number().min(1),
                        turns_until_usage: z.number().min(0),
                        current_consecutive_uses: z.number().min(0),
                    })
                ),
                statusEffects: z.array(
                    z.object({
                        descriptor: z.string().regex(DESCRIPTOR_REGEX()),
                        duration: z.number().nullable(),
                    })
                ),
                weaponry: z.array(
                    z.object({
                        descriptor: z.string().regex(DESCRIPTOR_REGEX()),
                        quantity: z.number().min(1),
                        turns_until_usage: z.number().min(0),
                        current_consecutive_uses: z.number().min(0),
                        is_active: z.boolean(),
                    })
                ),
            }),
        })
    ),
})

export { CombatEditorSchema }
