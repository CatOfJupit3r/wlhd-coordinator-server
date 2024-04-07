export interface Translation {
    [language: string]: {
        [dlc: string]: {
            [key: string]: string
        }
    }
}

export interface TranslatableString {
    main_string: string
    format_args?: {
        [key: string]: string | TranslatableString
    }
}
