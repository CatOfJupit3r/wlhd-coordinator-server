import {GameSocket} from "../components/Socket";
import {Socket} from "socket.io";


export class GameSocketService {
    private servingSockets: Map<string, GameSocket>;
    /*
    * Serving sockets is a map of game_id to GameSocket
    * Each GameSocket contains all players with their client sockets.
     */

    constructor() {
        this.servingSockets = new Map();
    }

    public connectToGame(gameId: string, userToken: string): void {
        /*
        * We try to match the game_id to a GameSocket
        * If there is no GameSocket for the game_id, we create one
        * Then, we pass the userToken to the GameSocket
         */
        if (!this.servingSockets.get(gameId)) {
            this.servingSockets.set(gameId, new GameSocket());
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
            this.servingSockets.set(gameId, new GameSocket());
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
            this.servingSockets.set(gameId, new GameSocket());
        } else {
            console.log('Game already exists');
        }
    }
}