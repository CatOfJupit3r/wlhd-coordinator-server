// @ts-ignore
import express from 'express';
// import "../prelaunch"; // this triggers the prelaunch code
import { TranslationController } from './controllers/TranslationController';
import { authenticationMiddleware } from './middleware/AuthenticationMiddleware';

const app = express();
const translationController = new TranslationController();

app.use(express.json());
app.use(authenticationMiddleware);

app.get('/translation', translationController.getTranslation.bind(translationController));
app.get('/translation-snippet', translationController.getTranslationSnippet.bind(translationController));
app.post('/reload-translations', translationController.reloadTranslations.bind(translationController));

export default app;
