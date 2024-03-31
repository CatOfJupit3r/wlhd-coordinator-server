export interface Translation {
    [language: string]: {
        [dlc: string]: {
            [key: string]: string
        }
    }
}
