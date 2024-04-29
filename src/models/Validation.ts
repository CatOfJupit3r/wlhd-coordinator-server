export type SupportedTypes = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any'

export interface Record {
    [key: string]: SupportedTypes
}

export interface Input {
    [key: string]: unknown
}

export interface SuccessfulValidation {
    success: true
}

export type Misses = Array<{
    key: string
    type: string
}>

export interface FailedValidation {
    success: false
    misses: Misses
}

export const VALID_INPUT = (): SuccessfulValidation => ({ success: true })

export const INVALID_INPUT = (misses: Misses): FailedValidation => ({ success: false, misses: misses })
