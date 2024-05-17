import { TranslationSnippet } from '../models/Translation'

type CachedTranslation = [TranslationSnippet, string, string]

export class TranslationCache {
    private cache: Map<string, CachedTranslation>

    constructor() {
        this.cache = new Map()
    }

    public get(key: string): CachedTranslation | undefined {
        return this.cache.get(key)
    }

    public set(key: string, value: CachedTranslation): void {
        this.cache.set(key, value)
    }

    public clear(): void {
        this.cache.clear()
    }
}
