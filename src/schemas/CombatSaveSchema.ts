import { DESCRIPTOR_REGEX } from '@configs'
import { z } from 'zod'

const ControlInfoZod = z
    .object({
        type: z.enum(['player', 'ai', 'game_logic']),
        id: z.string().optional(),
    })
    .refine((value) => {
        return !((value.type === 'player' || value.type === 'ai') && !value.id)
    })

export const GameMemoryZod = z
    .object({
        type: z.string(),
        value: z.any(),
        display_name: z.string(),
        display_value: z.string().nullable(),
        internal: z.boolean(),
    })
    .strict()

export const ComponentMemoryZod = z.record(z.string(), GameMemoryZod)

const DescriptorZod = z.string().regex(DESCRIPTOR_REGEX())

const CommonGameComponentZod = z.object({
    descriptor: DescriptorZod,
    decorations: z
        .object({
            name: z.string(),
            description: z.string(),
            sprite: z.string(),
        })
        .optional(),
    id_: z.string().optional(),
    memory: ComponentMemoryZod.nullable().optional(),
    tags: z.array(DescriptorZod).optional(),
})

const UsableComponentFieldsZod = z.object({
    usageCost: z.number().optional(),
    cooldownValue: z.number().nullable().optional(),
    turnsUntilUsage: z.number().optional(),
    currentConsecutiveUses: z.number().optional(),
    maxConsecutiveUses: z.number().nullable().optional(),
    consecutiveUsesResetOnCooldownUpdate: z.boolean().optional(),
    effectHook: DescriptorZod.optional(),
})

const MethodHooksZod = z.object({
    apply: DescriptorZod.nullable(),
    update: DescriptorZod.nullable(),
    dispel: DescriptorZod.nullable(),
    activate: DescriptorZod.nullable(),
})

const StatusEffectSaveFieldsZod = z
    .object({
        autoMessages: z.boolean().optional(),
        isVisible: z.boolean().optional(),
        activatesOnApply: z.boolean().optional(),
        static: z.boolean().optional(),
        updateType: z.string().optional(),
        activationType: z.string().optional(),
        methodHooks: MethodHooksZod.nullable().optional(),
        duration: z.number().min(1).optional(),
    })
    .merge(CommonGameComponentZod)

const ItemSaveFieldsZod = z
    .object({
        quantity: z.number().min(1).optional(),
    })
    .merge(CommonGameComponentZod)
    .merge(UsableComponentFieldsZod)

const WeaponSaveFieldsZod = z
    .object({
        quantity: z.number().min(1).optional(),
        isActive: z.boolean().optional(),
    })
    .merge(CommonGameComponentZod)
    .merge(UsableComponentFieldsZod)

const SpellSaveFieldsZod = z
    .object({
        isActive: z.boolean().optional(),
    })
    .merge(CommonGameComponentZod)
    .merge(UsableComponentFieldsZod)

const SpellBookSaveFieldsZod = z
    .object({
        knownSpells: z.array(SpellSaveFieldsZod),
        maxActiveSpells: z.number().min(0).nullable(),
    })
    .strict()

const CharacterSaveFieldsZod = z.object({
    decorations: z
        .object({
            name: z.string(),
            description: z.string(),
            sprite: z.string(),
        })
        .optional(),

    attributes: z.record(DescriptorZod, z.number()).optional(),
    states: z.record(DescriptorZod, z.number()).optional(),
    addedActionCosts: z.record(DescriptorZod, z.number()).optional(),

    statusEffects: z.array(StatusEffectSaveFieldsZod).optional(),
    inventory: z.array(ItemSaveFieldsZod).optional(),
    weaponry: z.array(WeaponSaveFieldsZod).optional(),
    spellBook: SpellBookSaveFieldsZod.optional(),

    memory: ComponentMemoryZod.nullable().optional(),
    tags: z.array(DescriptorZod).optional(),
    id_: z.string().optional(),
})

const SquareOnBattlefieldZod = z.object({
    descriptor: DescriptorZod,
    source: CharacterSaveFieldsZod,
    control: ControlInfoZod,
})

const TStringZod = z
    .object({
        key: DescriptorZod,
        args: z.record(z.string()).optional(),
    })
    .strict()

const TStringContainerZod = z.array(z.array(TStringZod))

const SquareZod = z.string().regex(/^[1-6]+\/[1-6]+$/)

const TurnOrderZod = z.array(z.string().nullable()).nonempty({
    message: 'Turn order should have at least one character',
})

const CombatSaveZod = z.object({
    round: z.number(),
    turnOrder: TurnOrderZod.optional(),
    battlefield: z.record(SquareZod, SquareOnBattlefieldZod.nullable()).optional(),
    messages: TStringContainerZod.optional(),
})

export type CombatSaveType = z.infer<typeof CombatSaveZod>

export default CombatSaveZod
