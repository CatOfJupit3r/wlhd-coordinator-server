import { Express } from 'express'
import http from 'http'
import DatabaseLoader from './database'
import DLCLoader from './dlc'
import ExpressLoader from './express'
import GameLoader from './game'
import SocketLoader from './sockets'

const RootLoader = async (app: Express, server: http.Server) => {
    console.log('Starting root loader...')

    console.log('Connecting to database...')
    await DatabaseLoader()
    console.log('Database connected successfully!')

    console.log('Starting socket server...')
    await SocketLoader(server)
    console.log('Socket server started successfully!')

    console.log('Connecting to game servers...')
    await GameLoader()
    console.log('Connection to game servers has been established successfully!')

    console.log('Loading DLCs...')
    await DLCLoader()
    console.log('DLCs loaded successfully!')

    console.log('Starting express server...')
    await ExpressLoader(app)
    console.log('Express server started successfully!')
}

export default RootLoader
