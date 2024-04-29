import { BadRequest } from '../models/ErrorModels'
import {
    FailedValidation,
    INVALID_INPUT,
    Input,
    Misses,
    Record,
    SuccessfulValidation,
    SupportedTypes,
    VALID_INPUT,
} from '../models/Validation'

class InputValidator {
    private VALIDATION_FAILED_MISSING_KEYS(misses: Misses): string {
        return (
            'Validation failed! Missing keys: {' +
            misses.reduce((acc, currentValue) => acc + ` ${currentValue.key}:${currentValue.type}`, '') +
            ' }.'
        )
    }

    private VALIDATION_FAILED_UNDEFINED(misses: Misses): string {
        return (
            'Validation failed! Undefined keys: {' +
            misses.reduce((acc, currentValue) => acc + ` ${currentValue.key}:${currentValue.type}`, '') +
            ' }.'
        )
    }

    public validateObject(
        input: Input,
        expected: Record,
        throwError: boolean = false
    ): FailedValidation | SuccessfulValidation {
        for (const [key, type] of Object.entries(expected)) {
            if (!input[key]) {
                if (throwError) throw new BadRequest(this.VALIDATION_FAILED_UNDEFINED([{ key, type }]))
                return INVALID_INPUT([{ key, type }])
            }
            const validation = this.validateField({ key, value: input[key] }, type)
            if (!validation.success) {
                if (throwError) throw new BadRequest(this.VALIDATION_FAILED_MISSING_KEYS(validation.misses))
                return INVALID_INPUT(validation.misses.map((miss) => ({ key: `${key}.${miss.key}`, type: miss.type })))
            }
        }
        return VALID_INPUT()
    }

    public validateField(
        input: { key: string; value: unknown },
        expectedType: SupportedTypes,
        throwError: boolean = false
    ): FailedValidation | SuccessfulValidation {
        const { key, value } = input
        if (!value) {
            if (throwError) throw new BadRequest(this.VALIDATION_FAILED_UNDEFINED([{ key, type: expectedType }]))
        }
        if (expectedType === 'any') return VALID_INPUT()
        if (expectedType === 'array') {
            if (!Array.isArray(value)) {
                if (throwError) throw new BadRequest(this.VALIDATION_FAILED_MISSING_KEYS([{ key, type: 'array' }]))
                return INVALID_INPUT([{ key, type: 'array' }])
            }
        }
        if (typeof value !== expectedType) {
            if (throwError) throw new BadRequest(this.VALIDATION_FAILED_MISSING_KEYS([{ key, type: expectedType }]))
            return INVALID_INPUT([{ key, type: expectedType }])
        }
        return VALID_INPUT()
    }
}

export default new InputValidator()
