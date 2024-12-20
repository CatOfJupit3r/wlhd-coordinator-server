import { GAME_SECRET_TOKEN, GAME_SERVER_URL } from '@configs'
import { GameServerStatus } from '@models/GameDLCData'
import { CombatClass } from '@models/TypegooseModels'
import axios, { isAxiosError } from 'axios'
import GameConversionService from './GameConversionService'
import LobbyService from './LobbyService'
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
        let installed
        try {
            const serverStatus = await this.checkGameServers()
            installed = serverStatus.installed
            if (!installed) {
                console.log('No DLCs found on game server')
                return
            }
        } catch (error: unknown) {
            if (isAxiosError(error)) {
                console.log('Connecting to game server failed')
            } else {
                console.log('Error loading game servers', error)
            }
        }
        PackageManagerService.resetCache()
        PackageManagerService.cacheAllDLCs()
        GameConversionService.resetCache()
    }

    async createCombatPreset(field: CombatClass['field']) {
        return await LobbyService.createNewCombatPreset(field)
    }

    async checkGameServers(): Promise<GameServerStatus> {
        const res = await this.fetch(`${GAME_SERVER_URL}/api/`)
        return res.data
    }

    private async fetch(url: string) {
        return await axios.get(url, {
            headers: {
                Authorization: `Bearer ${GAME_SECRET_TOKEN}`,
            },
        })
    }

    public getLoadedItems(dlc: string): {
        [descriptor: string]: ReturnType<(typeof GameConversionService)['convertItem']>
    } {
        return Object.fromEntries(
            Object.entries(PackageManagerService.getCachedItems(dlc)).map(([descriptor, itemPreset]) => [
                descriptor,
                GameConversionService.convertItem(itemPreset),
            ])
        )
    }

    public getLoadedWeapons(dlc: string): {
        [descriptor: string]: ReturnType<(typeof GameConversionService)['convertWeapon']>
    } {
        return Object.fromEntries(
            Object.entries(PackageManagerService.getCachedWeapons(dlc)).map(([descriptor, weaponPreset]) => [
                descriptor,
                GameConversionService.convertWeapon(weaponPreset),
            ])
        )
    }

    public getLoadedSpells(dlc: string): {
        [descriptor: string]: ReturnType<(typeof GameConversionService)['convertSpell']>
    } {
        return Object.fromEntries(
            Object.entries(PackageManagerService.getCachedSpells(dlc)).map(([descriptor, spellPreset]) => [
                descriptor,
                GameConversionService.convertSpell(spellPreset),
            ])
        )
    }

    public getLoadedStatusEffects(dlc: string): {
        [descriptor: string]: ReturnType<(typeof GameConversionService)['convertStatusEffect']>
    } {
        return Object.fromEntries(
            Object.entries(PackageManagerService.getCachedStatusEffects(dlc)).map(
                ([descriptor, statusEffectPreset]) => [
                    descriptor,
                    GameConversionService.convertStatusEffect(statusEffectPreset),
                ]
            )
        )
    }

    public getLoadedCharacters(dlc: string): {
        [descriptor: string]: ReturnType<(typeof GameConversionService)['convertCharacterPresetToEditable']>
    } {
        return Object.fromEntries(
            Object.entries(PackageManagerService.getCachedCharacters(dlc)).map(([descriptor, characterPreset]) => [
                descriptor,
                GameConversionService.convertCharacterPresetToEditable(characterPreset),
            ])
        )
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
