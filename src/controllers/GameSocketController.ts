import {GameSocketService} from "../services/GameSocketService";
import {Socket} from "socket.io";

export class GameSocketController {
    private gameSocketService: GameSocketService;

    constructor() {
        this.gameSocketService = new GameSocketService();
    }

    public handlePlayer(gameId: string, userToken: string, playerSocket: Socket): void {
        this.gameSocketService.handlePlayer(gameId, userToken, playerSocket);
    }

    public createGame(gameId: string) {
        this.gameSocketService.createGame(gameId);
    }
}