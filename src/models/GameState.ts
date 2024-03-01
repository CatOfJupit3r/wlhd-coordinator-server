export interface GameState {
    battlefield: string[][],
    game_descriptors: {
        lines: string[],
        columns: string[],
        field_components: {
            [key: string]: string
        },
        separators: string,
        connectors: string
    }
}