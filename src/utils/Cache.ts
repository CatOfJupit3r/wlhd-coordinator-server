export class Cache {
    private cache: Map<string, { [translation: string]: string }>

    constructor() {
        this.cache = new Map()
    }

    public get(key: string): { [translation: string]: string } | undefined {
        return this.cache.get(key)
    }

    public set(key: string, value: { [translation: string]: string }): void {
        this.cache.set(key, value)
    }

    public clear(): void {
        this.cache.clear()
    }

    public pop(key: string): { [translation: string]: string } {
        const value = this.cache.get(key)
        if (!value) {
            return {}
        }
        this.cache.delete(key)
        return value
    }
}
