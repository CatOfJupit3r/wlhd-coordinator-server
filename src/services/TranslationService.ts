import { TranslationJSON, TranslationLoaded, TranslationSnippet } from '@models/Translation'
import { getTranslationData, TranslationCache } from '@utils'

class TranslationService {
    private translations: TranslationLoaded = {}
    private cache: TranslationCache = new TranslationCache()

    constructor() {
        this.reloadTranslations()
    }

    public reloadTranslations(): void {
        this.cache.clear()
        this.translations = getTranslationData()
    }

    public getLanguage(languages: Array<string>, dlcs: Array<string>, strict: boolean): TranslationJSON {
        let request_results: TranslationJSON = {}
        for (const lang of languages) {
            for (const dlc of dlcs) {
                const cached = this.cache.get(`${lang}-${dlc}-${strict}`)
                let translationFiles: TranslationJSON
                let realLanguage: string
                let resultDlc: string

                if (cached) {
                    const [output, cachedRealLanguage, cachedResultDlc] = cached
                    realLanguage = cachedRealLanguage
                    resultDlc = cachedResultDlc
                    translationFiles = {
                        [realLanguage]: {
                            [resultDlc]: output,
                        },
                    }
                } else {
                    const [output, extractedRealLanguage, extractedResultDlc] = this.getLanguageTranslations(
                        lang,
                        dlc,
                        strict
                    )
                    realLanguage = extractedRealLanguage
                    resultDlc = extractedResultDlc

                    this.cache.set(`${lang}-${dlc}`, [output, realLanguage, resultDlc])
                    translationFiles = {
                        [realLanguage]: {
                            [resultDlc]: output,
                        },
                    }
                }
                request_results = this.injectTranslationToRequestResults(
                    realLanguage,
                    resultDlc,
                    translationFiles,
                    request_results
                )
            }
        }
        return request_results
    }

    public getTranslationSnippet(
        languages: Array<string>,
        dlcs: Array<string>,
        keys: Array<string>,
        strict: boolean
    ): TranslationJSON {
        let request_results: TranslationJSON = {}
        for (const lang of languages) {
            for (const dlc of dlcs) {
                const cached = this.cache.get(`${lang}-${dlc}-${strict}`)
                let translationFiles: TranslationJSON
                let realLanguage = lang
                let resultDlc = dlc

                if (cached) {
                    const [output, cachedRealLanguage, cachedResultDlc] = cached
                    realLanguage = cachedRealLanguage
                    resultDlc = cachedResultDlc

                    translationFiles = {
                        [realLanguage]: {
                            [resultDlc]: this.extractSnippet(output, keys.toString().split(',')),
                        },
                    }
                } else {
                    const [output, extractedRealLanguage, extractedResultDlc] = this.getLanguageTranslations(
                        lang,
                        dlc,
                        strict
                    )
                    realLanguage = extractedRealLanguage
                    resultDlc = extractedResultDlc
                    this.cache.set(`${lang}-${dlc}`, [output, realLanguage, resultDlc])
                    translationFiles = {
                        [realLanguage]: {
                            [resultDlc]: this.extractSnippet(output, keys.toString().split(',')),
                        },
                    }
                }
                request_results = this.injectTranslationToRequestResults(
                    realLanguage,
                    resultDlc,
                    translationFiles,
                    request_results
                )
            }
        }
        return request_results
    }

    private injectTranslationToRequestResults(
        realLanguage: string,
        resultDlc: string,
        translationFiles: TranslationJSON,
        request_results: TranslationJSON
    ) {
        if (Object.keys(request_results).includes(realLanguage)) {
            if (!request_results[realLanguage][resultDlc]) {
                request_results[realLanguage][resultDlc] = {}
            }
            request_results[realLanguage][resultDlc] = {
                ...(request_results[realLanguage][resultDlc] || {}),
                ...translationFiles[realLanguage][resultDlc],
            }
        } else {
            request_results = {
                ...request_results,
                ...translationFiles,
            }
        }
        return request_results
    }

    private getLanguageTranslations(
        languageCode: string,
        dlc: string,
        strict: boolean
    ): [TranslationSnippet, string, string] {
        let language: string = ''
        let dialect: string | undefined = ''
        if (/^[a-z]{2}-[A-Z]{2}$/gm.test(languageCode) || /^[a-z]{2}_[A-Z]{2}$/gm.test(languageCode)) {
            languageCode = languageCode.replace('-', '_')
            language = languageCode.split('_')[0]
            dialect = languageCode.split('_')[1]
            if (
                !strict &&
                this.translations[language] &&
                dialect &&
                !Object.keys(this.translations[language]).includes(dialect)
            )
                dialect = Object.keys(this.translations[language])[0] || 'US'
        } else if (/^[a-z]{2}$/gm.test(languageCode)) {
            language = languageCode
            dialect = (this.translations[language] && Object.keys(this.translations[language])[0]) || 'US'
        } else {
            return [{}, languageCode, dlc]
        }
        if (!dialect || !language || !dlc) {
            return [{}, languageCode, dlc || `unknown`]
        }
        return [this.getLanguageFiles(language, dlc, dialect), `${language}-${dialect}`, dlc]
    }

    private getLanguageFiles(language: string, dlc: string, region: string): TranslationSnippet {
        return (
            (this.translations[language] &&
                this.translations[language][region] &&
                this.translations[language][region][dlc]) ||
            {}
        )
    }

    private extractSnippet(fullTranslation: TranslationSnippet, keys: Array<string>): TranslationSnippet {
        let request_results: TranslationSnippet = {}
        for (const key of keys) {
            request_results = {
                ...request_results,
                [key]: fullTranslation[key],
            }
        }
        return request_results
    }
}

export default new TranslationService()
