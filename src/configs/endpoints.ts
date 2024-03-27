import { GAME_SERVER_API_URL } from './config'

export const GET_BATTLEFIELD = (game_id: string) => `${GAME_SERVER_API_URL}/${game_id}/battlefield`
export const GET_ENTITY_ACTIONS = (game_id: string, entity_id: string) =>
    `${GAME_SERVER_API_URL}/${game_id}/action_info/${entity_id}`
export const GET_MESSAGE = (game_id: string, message: string) =>
    `${GAME_SERVER_API_URL}/${game_id}/message/${message.toString()}`
export const GET_ALL_MESSAGES = (game_id: string) => `${GAME_SERVER_API_URL}/${game_id}/all_messages`
export const GET_ENTITY_TOOLTIP = (game_id: string, entity_id: string) =>
    `${GAME_SERVER_API_URL}/${game_id}/entity/${entity_id}`
export const GET_ENTITIES_INFO = (game_id: string) => `${GAME_SERVER_API_URL}/${game_id}/entities_info`
