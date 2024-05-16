import fs from 'fs'
import path from 'path'

import { PATH_TO_INSTALLED_PACKAGES } from '../configs'
import { Translation } from '../models/Translation'
import { Manifest } from '../models/dlc_manifest'

export const getTranslationData = (): Translation => {
    const result: Translation = {}

    try {
        const availableDLCs = getAvailableDLCs(PATH_TO_INSTALLED_PACKAGES)
        availableDLCs.forEach((dlc) => {
            const manifest = getManifest(PATH_TO_INSTALLED_PACKAGES, dlc)
            if (!manifest) return

            const dlcDescriptor = manifest.descriptor
            if (!dlcDescriptor) return

            const availableLanguages = getAvailableLanguages(PATH_TO_INSTALLED_PACKAGES, dlc)
            availableLanguages.forEach((language) => {
                result[language] = { ...result[language] }
                result[language][dlcDescriptor] = {
                    ...result[language][dlcDescriptor],
                }

                const languageData = getLanguageData(PATH_TO_INSTALLED_PACKAGES, dlc, language)
                languageData.forEach((translationFile) => {
                    const translation = readTranslationFile(PATH_TO_INSTALLED_PACKAGES, dlc, language, translationFile)
                    result[language][dlcDescriptor] = {
                        ...result[language][dlcDescriptor],
                        ...translation,
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

const readTranslationFile = (basePath: string, dlc: string, language: string, file: string): { [key: string]: any } => {
    try {
        const filePath = path.join(basePath, dlc, 'translations', language, file)
        const fileContent = fs.readFileSync(filePath, 'utf8')
        return JSON.parse(fileContent)
    } catch (e) {
        console.log(`Error reading translation file ${file} for language ${language} in DLC ${dlc}`, e)
        return {}
    }
}
