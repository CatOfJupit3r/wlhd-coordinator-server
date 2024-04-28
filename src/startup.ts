import dotenv from 'dotenv'
import express from 'express'
import http from 'http'
import RootLoader from './loaders'

const startServer = async () => {
    try {
        const app = express()
        const server = http.createServer(app)

        dotenv.config({
            path: '.env',
        })

        const PORT = (process.env.PORT && parseInt(process.env.PORT)) || 5000
        const HOST = process.env.HOST || 'localhost'

        await RootLoader(app, server)

        server.listen(PORT, HOST, () => {
            console.log(`
        #############################################
          Server listening on port: ${PORT} 
          Address: http://localhost:${PORT} ️
        #############################################
      `)
        })
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}

export default startServer
