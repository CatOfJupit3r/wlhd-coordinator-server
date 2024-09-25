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
    [key: string]: TranslationSnippet | string
}

export interface TranslatableString {
    key: string
    args?: {
        [key: string]: string | TranslatableString
    }
}
