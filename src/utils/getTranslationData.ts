import fs from 'fs'
import { PATH_TO_INSTALLED_PACKAGES } from '../configs'
import { Translation } from '../models/Translation'
import { Manifest } from '../models/dlc_manifest'

export const getTranslationData = (): Translation => {
    const result: Translation = {}

    try {
        const availableDLCs = fs.readdirSync(PATH_TO_INSTALLED_PACKAGES)
        availableDLCs.forEach((file) => {
            if (!fs.lstatSync(`${PATH_TO_INSTALLED_PACKAGES}/${file}`).isDirectory() || file === '.DS_Store') return
            const manifest = fs.readFileSync(`${PATH_TO_INSTALLED_PACKAGES}/${file}/manifest.json`, 'utf8')
            if (!manifest) return

            const dlcDescriptor = (JSON.parse(manifest) as Manifest).descriptor
            if (!dlcDescriptor) return
            const availableLanguages = fs.readdirSync(`${PATH_TO_INSTALLED_PACKAGES}/${file}/translations`)
            if (!availableLanguages) return
            availableLanguages.forEach((translationDir: string) => {
                if (
                    !fs
                        .lstatSync(`${PATH_TO_INSTALLED_PACKAGES}/${file}/translations/${translationDir}`)
                        .isDirectory() ||
                    translationDir === '.DS_Store'
                ) {
                    return
                }
                const language = translationDir
                const languageData = fs.readdirSync(`${PATH_TO_INSTALLED_PACKAGES}/${file}/translations/${language}`)
                result[language] = { ...result[language] }
                result[language][dlcDescriptor] = {
                    ...result[language][dlcDescriptor],
                }
                languageData.forEach((translationFile: string) => {
                    if (translationFile === '.DS_Store') {
                        return
                    }
                    const translation = fs.readFileSync(
                        `${PATH_TO_INSTALLED_PACKAGES}/${file}/translations/${language}/${translationFile}`,
                        'utf8'
                    )
                    result[language][dlcDescriptor] = {
                        ...result[language][dlcDescriptor],
                        ...JSON.parse(translation),
                    }
                })
            })
        })
    } catch (e) {
        console.log('Error reading translations', e)
    }
    return result
}
