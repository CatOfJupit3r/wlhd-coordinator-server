import { Request, Response } from 'express';
import { TranslationService } from '../services/TranslationService';
import { Cache } from '../utils/Cache';

export class TranslationController {
    private translationService: TranslationService;
    private cache: Cache;

    constructor() {
        this.translationService = new TranslationService();
        this.cache = new Cache();
    }

    public reloadTranslations(req: Request, res: Response): void {
        this.translationService.reloadTranslations();
        this.cache.clear();
        res.status(204).send();
    }

    public getTranslation(req: Request, res: Response): void {
        const { language, dlc } = req.query;
        if (!language || !dlc) {
            res.status(400).send('Missing language or dlc');
            return;
        }
        if (this.cache.get(`${language}-${dlc}`)) {
            res.json(this.cache.get(`${language}-${dlc}`));
            return;
        }
        const translation = this.translationService.getTranslation(language.toString(), dlc.toString());
        this.cache.set(`${language}-${dlc}`, translation);
        res.json(translation);
    }

    public getTranslationSnippet(req: Request, res: Response): void {
        const { language, dlc, keys } = req.query;
        if (!language || !dlc || !keys || !keys.toString().split(',' || keys.toString().split(',').length === 0)) {
            res.status(400).send('Missing language, dlc or keys');
            return;
        }
        if (this.cache.get(`${language}-${dlc}-${keys}`)) {
            res.json(this.cache.get(`${language}-${dlc}-${keys}`));
            return;
        }
        const translation = this.translationService.getTranslationSnippet(language.toString(), dlc.toString(), keys.toString().split(','));
        this.cache.set(`${language}-${dlc}-${keys}`, translation);
        res.json(translation);
    }
}
