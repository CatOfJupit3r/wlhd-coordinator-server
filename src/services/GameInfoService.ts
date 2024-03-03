import { GAME_SERVER_URL} from "../configs/config";
import axios from "axios";

export class GameInfoService {
    constructor() {}

    public getGameState(game_id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            axios.get(`${GAME_SERVER_URL}/${game_id}/get_game_state`)
                .then(response => {
                    resolve(response.data);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    public getGameField(game_id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            axios.get(`${GAME_SERVER_URL}/${game_id}/field`)
                .then(response => {
                    resolve(response.data);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    public getActionOptions(game_id: string, entity_id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            axios.get(`${GAME_SERVER_URL}/${game_id}/action_info/${entity_id}`)
                .then(response => {
                    resolve(response.data);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    public getMemoryCell(game_id: string, memory_cell: string): Promise<any> {
        return new Promise((resolve, reject) => {
            axios.get(`${GAME_SERVER_URL}/${game_id}/message/${memory_cell}`)
                .then(response => {
                    resolve(response.data);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    public getAllMemoryCells(game_id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            axios.get(`${GAME_SERVER_URL}/${game_id}/all_messages`)
                .then(response => {
                    resolve(response.data);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }
}