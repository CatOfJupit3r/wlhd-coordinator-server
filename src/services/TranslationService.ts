import { Translation } from '../models/Translation';
import {getTranslationData} from "../utils/getTranslationData";

export class TranslationService {
    private translations: Translation = {};

    constructor() {
        this.reloadTranslations();
    }

    public reloadTranslations(): void {
        this.translations = getTranslationData();
    }

    public getTranslation(language: string, dlc: string): { [p: string]: string } {
        if (language in this.translations && dlc in this.translations[language]) {
            return this.translations[language][dlc];
        } else {
            return {};
        }
    }

    public getTranslationSnippet(language: string, dlc: string, keys: string[]): { [p: string]: string } {
        const result: { [p: string]: string } = {};
        keys.forEach(key => {
            result[key] = this.translations[language][dlc][key];
        });
        return result;
    }
}
