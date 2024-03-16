import {GameSocket} from "../components/Socket";
import {Socket} from "socket.io";


export class GameSocketService {
    private servingSockets: Map<string, GameSocket>;
    private clearDynamicCache: (game_id: string) => void;
    /*
    * Serving sockets is a map of game_id to GameSocket
    * Each GameSocket contains all players with their client sockets.
     */

    constructor(
        clearDynamicCache: (game_id: string) => void
    ) {
        this.clearDynamicCache = clearDynamicCache;
        this.servingSockets = new Map();
        this.servingSockets.set("test", new GameSocket("test", this.clearDynamicCache));
    }

    public connectToGame(gameId: string, userToken: string): void {
        /*
        * We try to match the game_id to a GameSocket
        * If there is no GameSocket for the game_id, we create one
        * Then, we pass the userToken to the GameSocket
         */
        if (!this.servingSockets.get(gameId)) {
            this.servingSockets.set(gameId, new GameSocket(gameId, this.clearDynamicCache));
        }
        this.servingSockets.get(gameId)?.connect();
    }

    public handlePlayer(gameId: string, userToken: string, playerSocket: Socket): void {
        /*
        * We try to match the game_id to a GameSocket
        * If there is no GameSocket for the game_id, we create one
        * Then, we pass the userToken to the GameSocket
         */
        if (!this.servingSockets.get(gameId)) {
            this.createGame(gameId); // TODO: THIS CAUSES TO GENERATE A NEW GAME SOCKET TOO
        }
        this.servingSockets.get(gameId)?.handlePlayer(userToken, playerSocket);
    }

    public createGame(gameId: string) {
        /*
        * We try to match the game_id to a GameSocket
        * If there is no GameSocket for the game_id, we create one
        * Then, we pass the userToken to the GameSocket
         */
        if (!this.servingSockets.get(gameId)) {
            this.servingSockets.set(gameId, new GameSocket(
                gameId,
                this.clearDynamicCache
            ));
        } else {
            if (this.servingSockets.get(gameId)?.isActive()) {
                console.log('Game already exists');
            } else {
                this.servingSockets.get(gameId)?.connect();
            }
        }
    }
}