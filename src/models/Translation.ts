export interface TranslationLoaded {
    [language: string]: {
        [region: string]: {
            [dlc: string]: TranslationSnippet
        }
    }
}

export interface TranslationJSON {
    [languageCode: string]: {
        [dlc: string]: TranslationSnippet
    }
}

export interface TranslationSnippet {
    [key: string]: string
}

export interface TranslatableString {
    main_string: string
    format_args?: {
        [key: string]: string | TranslatableString
    }
}
