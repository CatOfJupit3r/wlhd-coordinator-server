import fs from 'fs'
import path from 'path'

import { PATH_TO_INSTALLED_PACKAGES } from '../configs'
import { Manifest } from '../models/GameDLCData'
import { TranslationLoaded, TranslationSnippet } from '../models/Translation'

export const getTranslationData = (): TranslationLoaded => {
    const result: TranslationLoaded = {}

    try {
        const availableDLCs = getAvailableDLCs(PATH_TO_INSTALLED_PACKAGES)
        availableDLCs.forEach((dlc) => {
            const manifest = getManifest(PATH_TO_INSTALLED_PACKAGES, dlc)
            if (!manifest) return

            const dlcDescriptor = manifest.descriptor
            if (!dlcDescriptor) return

            const availableLanguages = getAvailableLanguages(PATH_TO_INSTALLED_PACKAGES, dlc)
            availableLanguages.forEach((language_code) => {
                let language: string
                let region: string
                if (/^[a-z]{2}-[A-Z]{2}$/gm.test(language_code) || /^[a-z]{2}_[A-Z]{2}$/gm.test(language_code)) {
                    language_code = language_code.replace('-', '_')
                    language = language_code.split('_')[0]
                    region = language_code.split('_')[1]
                } else if (/^[a-z]{2}$/gm.test(language_code)) {
                    language = language_code
                    region = 'US'
                } else {
                    console.log(`Could not parse language ${language_code} for DLC ${dlc}. Skipping...`)
                    language = ''
                    region = ''
                    return
                }
                result[language] = { ...result[language] }
                result[language][region] = { ...result[language][region] }
                result[language][region][dlcDescriptor] = {
                    ...result[language][region][dlcDescriptor],
                }

                const languageData = getLanguageData(PATH_TO_INSTALLED_PACKAGES, dlc, language_code)
                languageData.forEach((translationFile) => {
                    try {
                        const translation = readTranslationFile(
                            PATH_TO_INSTALLED_PACKAGES,
                            dlc,
                            language_code,
                            translationFile
                        )
                        result[language][region][dlcDescriptor] = {
                            ...result[language][region][dlcDescriptor],
                            ...translation,
                        }
                    } catch (e) {
                        console.log(
                            `Error reading translation file ${translationFile} for language ${language} in DLC ${dlc}`,
                            e
                        )
                    }
                })
            })
        })
    } catch (e) {
        console.log('Error reading translations', e)
    }
    return result
}

const getAvailableDLCs = (basePath: string): string[] => {
    return fs.readdirSync(basePath).filter((file) => {
        return fs.lstatSync(path.join(basePath, file)).isDirectory() && file !== '.DS_Store'
    })
}

const getManifest = (basePath: string, dlc: string): Manifest | null => {
    try {
        const manifestPath = path.join(basePath, dlc, 'manifest.json')
        const manifestContent = fs.readFileSync(manifestPath, 'utf8')
        return JSON.parse(manifestContent) as Manifest
    } catch (e) {
        console.log(`Error reading manifest for DLC ${dlc}`, e)
        return null
    }
}

const getAvailableLanguages = (basePath: string, dlc: string): string[] => {
    const translationsPath = path.join(basePath, dlc, 'translations')
    return fs.readdirSync(translationsPath).filter((dir) => {
        return fs.lstatSync(path.join(translationsPath, dir)).isDirectory() && dir !== '.DS_Store'
    })
}

const getLanguageData = (basePath: string, dlc: string, language: string): string[] => {
    const languagePath = path.join(basePath, dlc, 'translations', language)
    return fs.readdirSync(languagePath).filter((file) => file !== '.DS_Store')
}

const readTranslationFile = (basePath: string, dlc: string, language: string, file: string): TranslationSnippet => {
    try {
        const filePath = path.join(basePath, dlc, 'translations', language, file)
        const fileContent = fs.readFileSync(filePath, 'utf8')
        return JSON.parse(fileContent)
    } catch (e) {
        console.log(`Error reading translation file ${file} for language ${language} in DLC ${dlc}`, e)
        return {}
    }
}
