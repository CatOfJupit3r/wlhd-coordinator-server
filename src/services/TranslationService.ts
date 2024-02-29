import { Translation } from '../models/Translation';
import { Cache } from '../utils/Cache';

export class TranslationService {
    private cache: Cache;

    constructor() {
        this.cache = new Cache();
    }

    public getTranslation(language: string, dlc: string): Translation {
        return {
            language,
            dlc,
            data: {} // Translation data
        };
    }
}
