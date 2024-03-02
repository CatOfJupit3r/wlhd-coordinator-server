export const GAME_SERVER_HOST = process.env.GAME_API_HOST || 'localhost';
export const GAME_SERVER_PORT = process.env.GAME_API_PORT || 4000;
export const GAME_SERVER_URL = `http://${GAME_SERVER_HOST}:${GAME_SERVER_PORT}`
export const GAME_SOCKET_PORT = process.env.GAME_SOCKET_PORT || 4001;
export const GAME_SOCKET_HOST = process.env.GAME_SOCKET_HOST || 'localhost';
