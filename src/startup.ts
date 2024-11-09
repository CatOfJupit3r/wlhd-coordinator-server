import { SERVER_HOST, SERVER_PORT } from '@config/env'
import express from 'express'
import http from 'http'
import RootLoader from './loaders'

const startServer = async () => {
    try {
        const app = express()
        const server = http.createServer(app)

        await RootLoader(app, server)

        server.listen(SERVER_PORT, SERVER_HOST, () => {
            console.log(`
        #############################################
          Server listening on port: ${SERVER_PORT} 
          Address: http://localhost:${SERVER_PORT} ️
        #############################################
      `)
        })
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}

export default startServer
