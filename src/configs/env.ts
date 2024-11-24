import dotenv from 'dotenv'

export const IS_DEVELOPMENT_MODE = process.env.NODE_ENV === 'development'

if (IS_DEVELOPMENT_MODE) {
    // Load .env file in development mode. In production, the environment variables are set in the server.
    dotenv.config({
        path: '.env',
    })
}

export const GAME_SERVER_URL = process.env.GAME_SERVER_URL || 'http://localhost:6000'
export const GAME_SECRET_TOKEN = process.env.GAME_SECRET_TOKEN || 'pancakes'
export const JWT_ACCESS_SECRET = process.env.JWT_SECRET || 'bigSecret'
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH || 'evenBiggerSecret'
export const SERVER_PORT = (process.env.PORT && parseInt(process.env.PORT)) || 5000
export const SERVER_HOST = process.env.HOST || 'localhost'
export const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017'
export const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'game'
export const MONGO_USER = process.env.MONGO_USER
export const MONGO_PASSWORD = process.env.MONGO_PASSWORD
export const CDN_URL = process.env.CDN_URL || 'http://localhost:9000'
export const CDN_SECRET_TOKEN = process.env.CDN_SECRET_TOKEN || 'pancakesWithStrawberry'
