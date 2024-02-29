// import translationsData from '../data/translations.json'; // Assuming translations are stored in a JSON file
import { Translation } from '../models/Translation';
import {getTranslationData} from "../utils/getTranslationData";

export class TranslationService {
    private translations: Translation = {};

    constructor() {
        this.translations = getTranslationData();
    }

    public reloadTranslations(): void {
        this.translations = getTranslationData();
    }

    public getTranslation(language: string, dlc: string): { [p: string]: string } {
        return this.translations[language][dlc];
    }

    public getTranslationSnippet(language: string, dlc: string, keys: string[]): { [p: string]: string } {
        const result: { [p: string]: string } = {};
        keys.forEach(key => {
            result[key] = this.translations[language][dlc][key];
        });
        return result;
    }
}
