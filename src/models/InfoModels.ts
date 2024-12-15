import { CharacterInfoFull } from './ClientModels'

export type CharacterInfo = Omit<CharacterInfoFull, 'square'>

export interface iUserAvatar {
    preferred: 'static' | 'generated'
    url: string
    generated: {
        pattern: string
        mainColor: string
        secondaryColor: string
    }
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
        avatar: iUserAvatar
        userId: string
        characters: Array<string>
    }>
    layout: 'default' | 'gm'
}
