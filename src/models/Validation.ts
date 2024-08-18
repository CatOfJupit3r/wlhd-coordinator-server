import { Types } from 'mongoose'

export type SupportedTypes = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any' | 'objectId'

export type TypeMapping = {
    string: string
    number: number
    boolean: boolean
    object: Record<string, unknown>
    array: any[]
    any: any
    objectId: Types.ObjectId | string
}

export type Schema = {
    [key: string]: keyof TypeMapping
}

export type Input<T extends Schema> = {
    [K in keyof T]: TypeMapping[T[K]]
}

export interface SuccessfulValidation<T = any> {
    success: true
    value: T
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

export const VALID_INPUT = <T>(value: T): SuccessfulValidation<T> => ({ success: true, value })
export const INVALID_INPUT = (misses?: Misses): FailedValidation => ({ success: false, misses: misses || [] })
