export const GAME_SERVER_HOST = process.env.GAME_SERVER_HOST || 'localhost';
export const GAME_SERVER_PORT = process.env.GAME_SERVER_PORT || 4000;
export const GAME_SERVER_URL = `http://${GAME_SERVER_HOST}:${GAME_SERVER_PORT}`
export const SECRET_TOKEN = process.env.SECRET_TOKEN