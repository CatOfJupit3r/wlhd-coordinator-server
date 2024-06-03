export interface CharacterInfo {
    descriptor: string
    decorations: {
        name: string
        description: string
        sprite: string
    }
    controlledBy: string | null
    attributes: {
        [key: string]: string
    }
    spellBook: Array<{
        descriptor: string
        conflictsWith: Array<string>
        requiresToUse: Array<string>
    }>
    spellLayout: Array<string>
    inventory: Array<{
        descriptor: string
        count: number
    }>
    weaponry: Array<{
        descriptor: string
        count: number
    }>
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
