import axios, { AxiosResponse } from 'axios'
import { GAME_SERVER_API_URL } from '../configs/config'
import { Battlefield, EntityAction, EntityInfo, GameStateContainer } from '../models/ServerModels'

class GameAPIService {
    private ENDPOINTS = {
        GET_BATTLEFIELD: (game_id: string) => `${GAME_SERVER_API_URL}/${game_id}/battlefield`,
        GET_ENTITY_ACTIONS: (game_id: string, entity_id: string) =>
            `${GAME_SERVER_API_URL}/${game_id}/action_info/${entity_id}`,
        GET_MESSAGE: (game_id: string, message: string) =>
            `${GAME_SERVER_API_URL}/${game_id}/message/${message.toString()}`,
        GET_ALL_MESSAGES: (game_id: string) => `${GAME_SERVER_API_URL}/${game_id}/all_messages`,
        GET_ENTITIES_INFO: (game_id: string) => `${GAME_SERVER_API_URL}/${game_id}/entities_info`,
    }

    public fetchBattlefield(game_id: string): Promise<Battlefield> {
        return new Promise((resolve, reject) => {
            axios
                .get(this.ENDPOINTS.GET_BATTLEFIELD(game_id))
                .then((response) => {
                    resolve(response.data)
                })
                .catch((error) => {
                    reject(error)
                })
        })
    }

    public fetchEntityActions(game_id: string, entity_id: string): Promise<EntityAction> {
        return new Promise((resolve, reject) => {
            axios
                .get(this.ENDPOINTS.GET_ENTITY_ACTIONS(game_id, entity_id))
                .then((response) => {
                    resolve(response.data)
                })
                .catch((error) => {
                    reject(error)
                })
        })
    }

    public fetchMessage(game_id: string, message: string): Promise<GameStateContainer> {
        return new Promise((resolve, reject) => {
            axios
                .get(this.ENDPOINTS.GET_MESSAGE(game_id, message))
                .then((response) => {
                    resolve(response.data)
                })
                .catch((error) => {
                    reject(error)
                })
        })
    }

    public fetchAllMessages(game_id: string): Promise<AxiosResponse<GameStateContainer>> {
        return new Promise((resolve, reject) => {
            axios
                .get(this.ENDPOINTS.GET_ALL_MESSAGES(game_id))
                .then((response) => {
                    resolve(response.data)
                })
                .catch((error) => {
                    reject(error)
                })
        })
    }

    public fetchAllEntityInfo(game_id: string): Promise<Array<EntityInfo>> {
        return new Promise((resolve, reject) => {
            axios
                .get(this.ENDPOINTS.GET_ENTITIES_INFO(game_id))
                .then((response) => {
                    resolve(response.data)
                })
                .catch((error) => {
                    reject(error)
                })
        })
    }
}

export default new GameAPIService()
