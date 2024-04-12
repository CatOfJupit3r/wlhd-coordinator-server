import fs from 'fs'
import { DLCManifest } from '../models/DLCManifest'
import { Translation } from '../models/Translation'

export const getTranslationData = (): Translation => {
    const result: Translation = {}
    const dlcFolderPath = 'src/data/translations'

    try {
        const translationsFiles = fs.readdirSync(dlcFolderPath)
        translationsFiles.forEach((file) => {
            if (file === '.DS_Store') {
                return
            }
            if (fs.lstatSync(`${dlcFolderPath}/${file}`).isFile()) {
                return
            }
            const manifest = fs.readFileSync(`${dlcFolderPath}/${file}/manifest.json`, 'utf8')

            const dlcDescriptor = (JSON.parse(manifest) as DLCManifest).descriptor
            const dlcContent = fs.readdirSync(`${dlcFolderPath}/${file}`)
            dlcContent.forEach((translationDir: string) => {
                if (translationDir === '.DS_Store') {
                    return
                }
                if (translationDir === 'manifest.json') {
                    return
                }
                const language = translationDir
                const languageData = fs.readdirSync(`${dlcFolderPath}/${file}/${translationDir}`)
                result[language] = { ...result[language] }
                result[language][dlcDescriptor] = {
                    ...result[language][dlcDescriptor],
                }
                languageData.forEach((translationFile: string) => {
                    if (translationFile === '.DS_Store') {
                        return
                    }
                    const translation = fs.readFileSync(
                        `${dlcFolderPath}/${file}/${language}/${translationFile}`,
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
