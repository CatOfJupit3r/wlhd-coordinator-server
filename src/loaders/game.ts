import GameServerService from '@services/GameServerService'
import { AxiosError } from 'axios'

const GameLoader = async () => {
    try {
        await GameServerService.init()
    } catch (error: unknown) {
        if (error instanceof AxiosError) {
            console.log('Error loading game servers', error.response?.data)
            process.exit(1)
        } else {
            console.log('Error loading game servers', error)
        }
    }
}

export default GameLoader
