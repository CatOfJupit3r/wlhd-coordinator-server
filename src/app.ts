// @ts-ignore
import express from 'express';
import cors from 'cors';
// import "../prelaunch"; // this triggers the prelaunch code
import { TranslationController } from './controllers/TranslationController';
import { authenticationMiddleware } from './middleware/AuthenticationMiddleware';
import {GameInfoController} from "./controllers/GameInfoController";

const app = express();
app.use(cors());
const translationController = new TranslationController();
const gameInfoController = new GameInfoController();

app.use(express.json());
app.use(authenticationMiddleware);

app.get('/translation', translationController.getTranslation.bind(translationController));
app.get('/translation-snippet', translationController.getTranslationSnippet.bind(translationController));
app.post('/reload-translations', translationController.reloadTranslations.bind(translationController));

app.get('/:game_id/game_state', gameInfoController.getGameState.bind(gameInfoController));
app.get('/:game_id/game_field', gameInfoController.getGameField.bind(gameInfoController));
app.get('/:game_id/action_options/:entity_id', gameInfoController.getActionOptions.bind(gameInfoController));
app.get('/:game_id/memory_cell/:memory_cell', gameInfoController.getMemoryCell.bind(gameInfoController));

export default app;
