export const GAME_SERVER_HOST = process.env.HOST || 'localhost';
export const GAME_SERVER_PORT = process.env.PORT || 4000;
export const GAME_SERVER_URL = `http://${GAME_SERVER_HOST}:${GAME_SERVER_PORT}`