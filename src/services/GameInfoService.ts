import { GAME_SERVER_URL} from "../configs/config";
import axios from "axios";

export class GameInfoService {
    constructor() {}

    public getGameField(game_id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            axios.get(`${GAME_SERVER_URL}/api/${game_id}/battlefield`)
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
            axios.get(`${GAME_SERVER_URL}/api/${game_id}/action_info/${entity_id}`)
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
            axios.get(`${GAME_SERVER_URL}/api/${game_id}/message/${memory_cell}`)
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
            axios.get(`${GAME_SERVER_URL}/api/${game_id}/all_messages`)
                .then(response => {
                    resolve(response.data);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    public getEntityInfo(game_id: string, entity_id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            axios.get(`${GAME_SERVER_URL}/api/${game_id}/entity/${entity_id}`)
                .then(response => {
                    resolve(response.data);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    public getAllEntityInfo(game_id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            axios.get(`${GAME_SERVER_URL}/api/${game_id}/entities_info`)
                .then(response => {
                    resolve(response.data);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }
}