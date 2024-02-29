export class Cache {
    private cache: Map<string, any>;

    constructor() {
        this.cache = new Map();
    }

    public get(key: string): any {
        return this.cache.get(key);
    }

    public set(key: string, value: any): void {
        this.cache.set(key, value);
    }
}
