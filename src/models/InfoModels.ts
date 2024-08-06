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
    spell_book: EntityInfoFull['spellBook']
    inventory: EntityInfoFull['inventory']
    weaponry: EntityInfoFull['weaponry']
    statusEffects: EntityInfoFull['status_effects']
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
        decorations: {
            name: string
            description: string
            sprite: string
        }
    }>
    gm: string
    players: Array<{
        handle: string
        nickname: string
        avatar: string
        userId: string
        characters: Array<string>
    }>
    layout: 'default' | 'gm'
}
