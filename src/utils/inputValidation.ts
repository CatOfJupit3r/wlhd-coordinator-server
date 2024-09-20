import { BadRequest } from '@models/ErrorModels'
import { ExtendedSchema, SuccessfulValidation } from 'just-enough-schemas'

export const checkSchemaWithThrow = <T>(
    schema: ExtendedSchema<T>,
    input: unknown,
    altMessage?: {
        CALLBACK_FAILED?: string
        WRONG_TYPE?: string
        MISSING_KEYS?: string
        EXCESS_KEYS?: string
        INTERNAL_ERROR?: string
    }
): SuccessfulValidation<T> => {
    const validation = schema.check(input as Record<string, unknown>)
    if (!validation.success) {
        const reason = altMessage?.[validation.type] || validation.message
        throw new BadRequest(validation.type, {
            reason,
        })
    }
    return validation
}
