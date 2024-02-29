import { Request, Response } from 'express';
import { TranslationService } from '../services/TranslationService';

export class TranslationController {
    private translationService: TranslationService;

    constructor() {
        this.translationService = new TranslationService();
    }

    public getTranslation(req: Request, res: Response): void {
        const { language, dlc } = req.query;
        const translation = this.translationService.getTranslation(language as string, dlc as string);
        res.json(translation);
    }
}
