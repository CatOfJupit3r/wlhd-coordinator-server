import { BadRequest, Exception } from '../models/ErrorModels'
import {
    FailDetails,
    FailedValidation,
    INVALID_INPUT,
    Input,
    Misses,
    Schema,
    SuccessfulValidation,
    SupportedTypes,
    VALID_INPUT,
} from '../models/Validation'

class InputValidator {
    private VALIDATION_FAILED(): string {
        return 'Validation failed!'
    }

    private WRONG_TYPE_DETAILS(provided: Input, schema: Schema, misses?: Misses): { details: FailDetails } {
        return {
            details: {
                type: 'wrong_type',
                required: Object.entries(schema).map(([key, type]) => ({ key, type })),
                provided: Object.entries(provided).map(([key, value]) => ({ key, type: typeof value })),
                misses: misses || [],
            },
        }
    }

    private MISSING_KEYS_DETAILS(provided: Input, schema: Schema, misses?: Misses): { details: FailDetails } {
        return {
            details: {
                type: 'missing_keys',
                required: Object.entries(schema).map(([key, type]) => ({ key, type })),
                provided: Object.entries(provided).map(([key, value]) => ({ key, type: typeof value })),
                misses: misses || [],
            },
        }
    }

    public validateObject(
        input: Input,
        expected: Schema,
        throwRequestError: boolean = true
    ): FailedValidation | SuccessfulValidation {
        try {
            for (const [key, type] of Object.entries(expected)) {
                if (!input[key]) {
                    if (throwRequestError)
                        throw new BadRequest(
                            this.VALIDATION_FAILED(),
                            this.MISSING_KEYS_DETAILS(input, expected, [
                                {
                                    key,
                                    type,
                                },
                            ])
                        )
                    return INVALID_INPUT([{ key, type }])
                }
                const validation = this.validateField({ key, value: input[key] }, type, false)
                if (!validation.success) {
                    if (throwRequestError)
                        throw new BadRequest(
                            this.VALIDATION_FAILED(),
                            this.WRONG_TYPE_DETAILS(
                                input,
                                expected,
                                validation.misses.map((miss) => ({
                                    key: `${key}.${miss.key}`,
                                    type: miss.type,
                                }))
                            )
                        )
                    return INVALID_INPUT(
                        validation.misses.map((miss) => ({
                            key: `${key}.${miss.key}`,
                            type: miss.type,
                        }))
                    )
                }
            }
            return VALID_INPUT()
        } catch (error: unknown) {
            if (error instanceof Exception) throw error
            else {
                console.log(error)
                if (throwRequestError)
                    throw new BadRequest(
                        'Something went wrong during handling of your request. Please, verify your input via API Documentation.'
                    )
                throw error
            }
        }
    }

    public validateField(
        input: { key: string; value: unknown },
        expectedType: SupportedTypes,
        throwRequestError: boolean = true
    ): FailedValidation | SuccessfulValidation {
        try {
            const { key, value } = input
            if (!value) {
                if (throwRequestError)
                    throw new BadRequest(
                        this.VALIDATION_FAILED(),
                        this.MISSING_KEYS_DETAILS({ [key]: value }, { [key]: expectedType }, [
                            {
                                key,
                                type: expectedType,
                            },
                        ])
                    )
            }
            if (expectedType === 'any') return VALID_INPUT()
            if (expectedType === 'array') {
                if (!Array.isArray(value)) {
                    if (throwRequestError)
                        throw new BadRequest(
                            this.VALIDATION_FAILED(),
                            this.WRONG_TYPE_DETAILS({ [key]: value }, { [key]: expectedType }, [{ key, type: 'array' }])
                        )
                    return INVALID_INPUT([{ key, type: 'array' }])
                }
            }
            if (typeof value !== expectedType) {
                if (throwRequestError)
                    throw new BadRequest(
                        this.VALIDATION_FAILED(),
                        this.WRONG_TYPE_DETAILS({ [key]: value }, { [key]: expectedType }, [
                            {
                                key,
                                type: expectedType,
                            },
                        ])
                    )
                return INVALID_INPUT([{ key, type: expectedType }])
            }
            return VALID_INPUT()
        } catch (error: unknown) {
            if (error instanceof Exception) throw error
            else {
                console.log(error)
                if (throwRequestError)
                    throw new BadRequest(
                        'Something went wrong during handling of your request. Please, verify your input via API Documentation.'
                    )
                throw error
            }
        }
    }
}

export default new InputValidator()
