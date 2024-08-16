import { Types } from 'mongoose'
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
    TypeMapping,
    VALID_INPUT,
} from '../models/Validation'

class InputValidator {
    private VALIDATION_FAILED(): string {
        return 'Validation failed!'
    }

    private WRONG_TYPE_DETAILS<T extends Schema>(
        provided: { [K in keyof T]: any },
        schema: T,
        misses?: Misses
    ): { details: FailDetails } {
        return {
            details: {
                type: 'wrong_type',
                required: Object.entries(schema).map(([key, type]) => ({ key, type })),
                provided: Object.entries(provided).map(([key, value]) => ({ key, type: typeof value })),
                misses: misses || [],
            },
        }
    }

    private MISSING_KEYS_DETAILS<T extends Schema>(
        provided: { [K in keyof T]: any },
        schema: T,
        misses?: Misses
    ): { details: FailDetails } {
        return {
            details: {
                type: 'missing_keys',
                required: Object.entries(schema).map(([key, type]) => ({ key, type })),
                provided: Object.entries(provided).map(([key, value]) => ({ key, type: typeof value })),
                misses: misses || [],
            },
        }
    }

    public validateObject<T extends Schema>(
        input: Input<T>,
        expected: T,
        throwRequestError: true
    ): SuccessfulValidation<{ [K in keyof T]: TypeMapping[T[K]] }>

    public validateObject<T extends Schema>(
        input: Input<T>,
        expected: T,
        throwRequestError?: false
    ): FailedValidation | SuccessfulValidation<{ [K in keyof T]: TypeMapping[T[K]] }>

    public validateObject<T extends Schema>(
        input: Input<T>,
        expected: T,
        throwRequestError: boolean = true
    ): FailedValidation | SuccessfulValidation<{ [K in keyof T]: TypeMapping[T[K]] }> {
        try {
            for (const [key, type] of Object.entries(expected)) {
                if (input[key] === undefined) {
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
            return VALID_INPUT(input as { [K in keyof T]: TypeMapping[T[K]] })
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

    public validateField<T extends SupportedTypes>(
        input: { key: string; value: any },
        expectedType: T,
        throwRequestError: true
    ): SuccessfulValidation<TypeMapping[T]>

    public validateField<T extends SupportedTypes>(
        input: { key: string; value: any },
        expectedType: T,
        throwRequestError?: false
    ): FailedValidation | SuccessfulValidation<TypeMapping[T]>

    public validateField<T extends SupportedTypes>(
        input: { key: string; value: any },
        expectedType: T,
        throwRequestError: boolean = true
    ): FailedValidation | SuccessfulValidation<TypeMapping[T]> {
        try {
            const { key, value } = input
            if (value === undefined) {
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
            if (expectedType === 'any') return VALID_INPUT(value as any)
            if (expectedType === 'objectId') {
                if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) {
                    if (throwRequestError)
                        throw new BadRequest(
                            this.VALIDATION_FAILED(),
                            this.WRONG_TYPE_DETAILS({ [key]: value }, { [key]: expectedType }, [
                                { key, type: 'objectId' },
                            ])

                            // this.WRONG_TYPE_DETAILS({ [key]: value }, { [key]: expectedType }, [
                            //     { key, type: 'objectId' },
                            // ]),
                        )
                    return INVALID_INPUT([{ key, type: expectedType }])
                }
            } else if (expectedType === 'array') {
                if (!Array.isArray(value)) {
                    if (throwRequestError)
                        throw new BadRequest(
                            this.VALIDATION_FAILED(),
                            this.WRONG_TYPE_DETAILS({ [key]: value }, { [key]: expectedType }, [{ key, type: 'array' }])
                        )
                    return INVALID_INPUT([{ key, type: expectedType }])
                }
            } else if (typeof value !== expectedType) {
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
            return VALID_INPUT(value as TypeMapping[T])
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

    public validateParams<T extends Schema>(
        input: Input<T>,
        expected: T,
        throwRequestError: true
    ): SuccessfulValidation<{ [K in keyof T]: TypeMapping[T[K]] }>

    public validateParams<T extends Schema>(
        input: Input<T>,
        expected: T,
        throwRequestError?: false
    ): FailedValidation | SuccessfulValidation<{ [K in keyof T]: TypeMapping[T[K]] }>

    public validateParams<T extends Schema>(
        input: Input<T>,
        expected: T,
        throwRequestError: boolean = true
    ): FailedValidation | SuccessfulValidation<{ [K in keyof T]: TypeMapping[T[K]] }> {
        try {
            if (throwRequestError) return this.validateObject(input, expected, throwRequestError)
            return this.validateObject(input, expected, throwRequestError)
        } catch (error: unknown) {
            if (error instanceof Exception) {
                error.message = 'Invalid route parameters! Check your input and try again.'
            }
            throw error
        }
    }
}

export default new InputValidator()
