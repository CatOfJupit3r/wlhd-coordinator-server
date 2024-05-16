import axios, { isAxiosError } from 'axios'
import { GAME_SERVER_URL } from '../configs/config'
import AssetController from '../controllers/AssetController'
import TranslationController from '../controllers/TranslationController'
import { GameServerStatus, Manifest } from '../models/dlc_manifest'
import DatabaseService from './DatabaseService'
import PackageManagerService from './PackageManagerService'

class GameServerService {
    // private gameServerConnection = io(GAME_SERVER_URL, {
    //     reconnectionDelayMax: 10000,
    //     reconnection: true,
    //     reconnectionAttempts: 100,
    //     reconnectionDelay: 1000,
    //     autoConnect: false,
    // })

    constructor() {
        // this.addListeners()
    }

    async init() {
        try {
            const { installed } = await this.checkGameServers()
            if (!installed) {
                console.log('No DLCs found on game server')
                return
            }
            await this.installDLCs(installed)
        } catch (error: unknown) {
            if (isAxiosError(error)) {
                console.log('Connecting to game server failed, installing mandatory packages')
                await PackageManagerService.installMandatoryPackages()
            } else {
                console.log('Error loading game servers', error)
            }
        }
    }

    async createCombatPreset(field: any) {
        return await DatabaseService.createNewCombatPreset(field)
    }

    async checkGameServers(): Promise<GameServerStatus> {
        const res = await axios.get(`${GAME_SERVER_URL}/api/`)
        return res.data
    }

    async installDLCs(manifests: Manifest[]) {
        await PackageManagerService.installPackages(manifests)
        TranslationController.reloadTranslations()
        AssetController.reloadAssets()
    }

    // private addListeners() {
    //     const LISTENERS: { [key: string]: () => void } = {
    //         connect: async () => {
    //             console.log('Connected to game server')
    //             const { installed } = await this.checkGameServers()
    //             await this.installDLCs(installed)
    //         },
    //         disconnect: async () => {
    //             console.log('Disconnected from game server')
    //         },
    //         reconnect: async () => {
    //             console.log('Reconnected to game server')
    //             const { installed } = await this.checkGameServers()
    //             await this.installDLCs(installed)
    //         },
    //     }
    //     Object.keys(LISTENERS).forEach((event) => {
    //         this.gameServerConnection.on(event, LISTENERS[event])
    //     })
    // }
}

export default new GameServerService()
