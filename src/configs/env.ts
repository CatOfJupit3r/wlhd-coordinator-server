import dotenv from 'dotenv'

dotenv.config({
    path: '.env',
})

export const GAME_SERVER_URL = process.env.GAME_SERVER_URL || 'http://localhost:6000'
export const GAME_SECRET_TOKEN = process.env.GAME_SECRET_TOKEN || 'pancakes'
export const JWT_ACCESS_SECRET = process.env.JWT_SECRET || 'bigSecret'
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH || 'evenBiggerSecret'
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN
export const IS_DEVELOPMENT_MODE = process.env.NODE_ENV === 'development'
export const SERVER_PORT = (process.env.PORT && parseInt(process.env.PORT)) || 5000
export const SERVER_HOST = process.env.HOST || 'localhost'
