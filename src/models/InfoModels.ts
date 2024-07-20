import { EntityInfoFull } from './ClientModels'

export interface CharacterInfo {
    descriptor: string
    decorations: {
        name: string
        description: string
        sprite: string
    }
    attributes: {
        [key: string]: string
    }
    spellBook: EntityInfoFull['spells']
    inventory: EntityInfoFull['items']
    weaponry: EntityInfoFull['weapons']
    statusEffects: EntityInfoFull['status_effects']
    spellLayout: Array<string>
}

export interface LobbyInfo {
    lobbyId: string
    name: string
    combats: Array<{
        nickname: string
        isActive: boolean
        roundCount: number
        activePlayers: Array<{
            handle: string
            nickname: string
        }>
    }>
    characters: Array<{
        descriptor: string
        name: string
        description: string
        sprite: string
    }>
    gm: string
    players: Array<{
        player: {
            handle: string
            nickname: string
            avatar: string
            userId: string
        }
        characters: Array<{
            descriptor: string
            name: string
            sprite: string
        }>
    }>
    layout: 'default' | 'gm'
    controlledEntity: {
        name: string
        id: string
    } | null
}
