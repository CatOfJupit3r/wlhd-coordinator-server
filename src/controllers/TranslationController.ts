import { Request, Response } from 'express';
import { TranslationService } from '../services/TranslationService';

export class TranslationController {
    private translationService: TranslationService;

    constructor() {
        this.translationService = new TranslationService();
    }

    public reloadTranslations(req: Request, res: Response): void {
        this.translationService.reloadTranslations();
        res.status(204).send();
    }

    public getTranslation(req: Request, res: Response): void {
        const { language, dlc } = req.query;
        if (!language || !dlc) {
            res.status(400).send('Missing language or dlc');
            return;
        }
        const translation = this.translationService.getTranslation(language.toString(), dlc.toString());
        res.json(translation);
    }

    public getTranslationSnippet(req: Request, res: Response): void {
        const { language, dlc, keys } = req.query;
        if (!language || !dlc || !keys || !keys.toString().split(',' || keys.toString().split(',').length === 0)) {
            res.status(400).send('Missing language, dlc or keys');
            return;
        }
        const translation = this.translationService.getTranslationSnippet(language.toString(), dlc.toString(), keys.toString().split(','));
        res.json(translation);
    }
}
