import axios, { AxiosResponse } from 'axios'
import {
    GET_ALL_MESSAGES,
    GET_BATTLEFIELD,
    GET_ENTITIES_INFO,
    GET_ENTITY_ACTIONS,
    GET_ENTITY_TOOLTIP,
    GET_MESSAGE,
} from '../configs/endpoints'
import {
    Battlefield,
    BattlefieldEntitiesInformation,
    EntityAction,
    EntityTooltip,
    GameMessagesContainer,
} from '../models/GameModels'

export const fetchBattlefield = (game_id: string): Promise<Battlefield> => {
    return new Promise((resolve, reject) => {
        axios
            .get(GET_BATTLEFIELD(game_id))
            .then((response) => {
                resolve(response.data)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

export const fetchEntityActions = (game_id: string, entity_id: string): Promise<EntityAction> => {
    return new Promise((resolve, reject) => {
        axios
            .get(GET_ENTITY_ACTIONS(game_id, entity_id))
            .then((response) => {
                resolve(response.data)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

export const fetchMessage = (game_id: string, message: string): Promise<GameMessagesContainer> => {
    return new Promise((resolve, reject) => {
        axios
            .get(GET_MESSAGE(game_id, message))
            .then((response) => {
                resolve(response.data)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

export const fetchAllMessages = (game_id: string): Promise<AxiosResponse<GameMessagesContainer>> => {
    return new Promise((resolve, reject) => {
        axios
            .get(GET_ALL_MESSAGES(game_id))
            .then((response) => {
                resolve(response.data)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

export const fetchEntityTooltip = (game_id: string, entity_id: string): Promise<EntityTooltip> => {
    return new Promise((resolve, reject) => {
        axios
            .get(GET_ENTITY_TOOLTIP(game_id, entity_id))
            .then((response) => {
                resolve(response.data)
            })
            .catch((error) => {
                reject(error)
            })
    })
}

export const fetchAllEntityInfo = (game_id: string): Promise<BattlefieldEntitiesInformation> => {
    return new Promise((resolve, reject) => {
        axios
            .get(GET_ENTITIES_INFO(game_id))
            .then((response) => {
                resolve(response.data)
            })
            .catch((error) => {
                reject(error)
            })
    })
}
