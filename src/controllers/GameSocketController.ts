import { Request, Response } from 'express';
import { Socket } from 'socket.io';
import { GameSocketService } from '../services/GameSocketService';

export class GameSocketController {
    private gameSocketService: GameSocketService;

    constructor(clearDynamicCache: (game_id: string) => void) {
        this.gameSocketService = new GameSocketService(clearDynamicCache);
    }

    public handlePlayer(gameId: string, userToken: string, playerSocket: Socket): void {
        this.gameSocketService.handlePlayer(gameId, userToken, playerSocket);
    }

    public createGame(req: Request, res: Response) {
        const { game_id } = req.params;
        this.gameSocketService.createGame(game_id);
        res.json({ status: 'ok' });
    }
}
