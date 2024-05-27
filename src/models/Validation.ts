export type SupportedTypes = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any'

export interface Schema {
    [key: string]: SupportedTypes
}

export interface Input {
    [key: string]: unknown
}

export interface SuccessfulValidation {
    success: true
}

export interface SchemaValue {
    key: string
    type: SupportedTypes
}

export type Misses = Array<SchemaValue>

export interface FailedValidation {
    success: false
    misses: Misses
}

export interface FailDetails {
    type: string
    required: Array<SchemaValue>
    provided: Array<{
        key: string
        type: string
    }>
    misses: Misses
}

export const VALID_INPUT = (): SuccessfulValidation => ({ success: true })

export const INVALID_INPUT = (misses: Misses): FailedValidation => ({ success: false, misses: misses })
