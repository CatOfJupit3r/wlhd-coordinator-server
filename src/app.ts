// @ts-ignore
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

import { TranslationController } from './controllers/TranslationController';
import { authenticationMiddleware } from './middleware/AuthenticationMiddleware';
import { GameInfoController } from "./controllers/GameInfoController";
import { GameSocketController } from "./controllers/GameSocketController";

const app = express();
app.use(cors());

// both socket and http server are created on the same port
const server = http.createServer(app);
const io = new SocketIOServer(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});


const translationController = new TranslationController();
const gameInfoController = new GameInfoController();
const gameSocketController = new GameSocketController(
    gameInfoController.clearDynamicCache.bind(gameInfoController)
);


app.use(express.json());
app.use(authenticationMiddleware);

app.get('/translation', translationController.getTranslation.bind(translationController));
app.get('/translation-snippet', translationController.getTranslationSnippet.bind(translationController));
app.post('/reload-translations', translationController.reloadTranslations.bind(translationController));

app.get('/:game_id/battlefield', gameInfoController.getGameField.bind(gameInfoController));
app.get('/:game_id/action_options/:entity_id', gameInfoController.getActionOptions.bind(gameInfoController));
app.get('/:game_id/memory_cell/:memory_cell', gameInfoController.getMemoryCell.bind(gameInfoController));
app.get('/:game_id/all_messages', gameInfoController.getAllMemoryCells.bind(gameInfoController));

app.get('/:game_id/create_game', gameSocketController.createGame.bind(gameSocketController));


io.on('connection', (socket) => {
    const gameId = socket.handshake.query.game_id;
    const userToken = socket.handshake.query.user_token;
    console.log('Connected', gameId, userToken);
    if (!gameId || !userToken) {
        console.log('Invalid connection');
        return;
    }
    gameSocketController.handlePlayer(gameId as string, userToken as string, socket);
});


export default server;
