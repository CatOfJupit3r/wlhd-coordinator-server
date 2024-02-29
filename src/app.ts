// @ts-ignore
import express from 'express';
import { TranslationController } from './controllers/TranslationController';
import { authenticationMiddleware } from './middleware/AuthenticationMiddleware';

const app = express();
const translationController = new TranslationController();

app.use(express.json());
app.use(authenticationMiddleware);

app.get('/translation', translationController.getTranslation.bind(translationController));

export default app;
