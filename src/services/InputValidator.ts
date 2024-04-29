type SupportedTypes = 'string' | 'number' | 'boolean' | 'object' | 'array'

interface Record {
    [key: string]: SupportedTypes
}

interface Input {
    [key: string]: unknown
}

interface SuccessfulValidation {
    success: true
}

interface FailedValidation {
    success: false
    miss: Array<{
        key: string
        type: string
    }>
}

class InputValidator {
    public validateObject(input: Input, expected: Record): FailedValidation | SuccessfulValidation {
        for (const [key, type] of Object.entries(expected)) {
            if (!input[key]) {
                return {
                    success: false,
                    miss: [{ key, type }],
                }
            }
            const validation = this.validateField(type, input[key], key)
            if (!validation.success)
                return {
                    success: false,
                    miss: validation.miss.map((miss) => ({ key: `${key}.${miss.key}`, type: miss.type })),
                }
        }
        return { success: true }
    }

    public validateField(
        expectedType: SupportedTypes,
        value: unknown,
        key: string
    ): FailedValidation | SuccessfulValidation {
        if (expectedType === 'array') {
            if (!Array.isArray(value)) {
                return {
                    success: false,
                    miss: [{ key, type: 'array' }],
                }
            }
        }
        if (typeof value !== expectedType) {
            return {
                success: false,
                miss: [{ key, type: expectedType }],
            }
        }
        return { success: true }
    }
}

export default new InputValidator()
