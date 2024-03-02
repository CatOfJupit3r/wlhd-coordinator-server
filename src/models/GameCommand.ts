export interface GameCommand {
    command: string,
    payload?: {
        [key: string]: string
    }
}