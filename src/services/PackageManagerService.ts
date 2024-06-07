import fs from 'fs'
import path from 'path'
import { simpleGit, SimpleGit } from 'simple-git'

import { GITHUB_LINK_REGEX, GITHUB_TOKEN, PATH_TO_INSTALLED_PACKAGES } from '../configs'
import { DLCPreset, Manifest } from '../models/GameDLCData'

type presetTypes = 'weapons' | 'spells' | 'items' | 'status_effects' | 'entities'

class PackageManagerService {
    private git: SimpleGit
    private CLEANUP: boolean = false
    private mandatoryPackages: Array<{
        source: string
        title: string
    }> = [
        {
            source: 'https://github.com/CatOfJupit3r/wlhd-builtins-package',
            title: 'builtins',
        },
    ]
    private cachedPresets: { [dlc: string]: { [type: presetTypes | string]: { [descriptor: string]: any } } } = {
        builtins: {
            weapons: {},
            spells: {},
            items: {},
            status_effects: {},
        },
    }

    constructor() {
        this.git = simpleGit({
            baseDir: PATH_TO_INSTALLED_PACKAGES,
            binary: 'git',
            maxConcurrentProcesses: 6,
        })
        this.checkInstallationFolder()
    }

    private checkIfGithubCredentialsExist() {
        return !!GITHUB_TOKEN()
    }

    public async installPackages(manifests: Array<Manifest>) {
        if (!this.checkIfGithubCredentialsExist()) {
            console.error('Github credentials not found, please provide a GITHUB_TOKEN')
            return
        }
        this.checkInstallationFolder()
        const encounteredPackages: string[] = []
        for (const manifest of manifests) {
            const { source, title, author, descriptor } = manifest
            console.log(`Installing DLC: ${title} by ${author}`)
            if (!this.verifyGithubLink(source)) {
                console.error(`Invalid Github link for package ${title}`)
                continue
            }
            await this.installPackage(source, descriptor)
        }
        await this.installMandatoryPackages(encounteredPackages)
        this.CLEANUP && this.cleanPackageFolder()
        this.verifyPackageManifest()
    }

    public async installMandatoryPackages(encounteredPackages: string[] = []) {
        for (const { source, title } of this.mandatoryPackages) {
            if (!encounteredPackages.includes(title)) {
                console.log(`Installing mandatory package ${title}`)
                await this.installPackage(source, title)
            }
        }
    }

    public async installPackage(source: string, packageName: string) {
        if (!packageName || !source) {
            console.log('Invalid package name or source', packageName, source)
            return
        }
        const packagePath = path.join(PATH_TO_INSTALLED_PACKAGES, packageName)
        if (fs.existsSync(packagePath)) {
            try {
                console.log(`Package ${packageName} already installed, updating...`)
                await this.gitPull(packageName)
                console.log(`Package ${packageName} updated successfully`)
            } catch (e: unknown) {
                console.log(`Failed to update package ${packageName}`, e)
                console.log('Removing package...')
                fs.rmSync(packagePath, { recursive: true })
                console.log('Reinstalling package...')
                await this.gitClone(source, packageName)
            }
        } else {
            console.log(`Package ${packageName} not found. Installing from provided source...`)
            await this.gitClone(source, packageName)
        }
    }

    private async gitClone(source: string, packageName: string) {
        const dir = `${packageName}`
        await this.git.clone(this.injectGithubToken(source), dir)
    }

    private async gitPull(packageName: string) {
        const dir = path.join(PATH_TO_INSTALLED_PACKAGES, packageName)
        const dlc_git = simpleGit({
            baseDir: dir,
            binary: 'git',
            maxConcurrentProcesses: 6,
        })
        await dlc_git.reset(['--hard', 'origin'])
        await dlc_git.pull('origin', 'main', ['--rebase'])
    }

    private checkInstallationFolder() {
        console.log('Checking installation folder...')
        if (!fs.existsSync(PATH_TO_INSTALLED_PACKAGES)) {
            console.log('Installation folder not found, creating...')
            fs.mkdirSync(PATH_TO_INSTALLED_PACKAGES)
        }
    }

    private cleanPackageFolder() {
        const onlyRequiresFiles = ['manifest.json', 'translations', 'assets', 'data', '.git']
        const dlc = fs.readdirSync(PATH_TO_INSTALLED_PACKAGES)
        for (const folder of dlc) {
            const folderPath = path.join(PATH_TO_INSTALLED_PACKAGES, folder)
            const dlcFiles = fs.readdirSync(folderPath)
            for (const file of dlcFiles) {
                if (!onlyRequiresFiles.includes(file)) {
                    fs.rmSync(`${folderPath}/${file}`, { recursive: true })
                }
            }
        }
    }

    private verifyPackageManifest() {
        const dlc = fs.readdirSync(PATH_TO_INSTALLED_PACKAGES)
        for (const folder of dlc) {
            const folderPath = path.join(PATH_TO_INSTALLED_PACKAGES, folder)
            const dlcFiles = fs.readdirSync(folderPath)
            if (!dlcFiles.includes('manifest.json')) {
                console.log(`Manifest not found for package ${folder}`)
                fs.rmSync(folderPath, { recursive: true })
            } else {
                const manifest = JSON.parse(fs.readFileSync(path.join(folderPath, 'manifest.json'), 'utf-8'))
                if (!manifest.descriptor || !manifest.source) {
                    console.log(`Invalid manifest for package ${folder}`)
                    fs.rmSync(folderPath, { recursive: true })
                }
            }
        }
    }

    private verifyGithubLink(url: string): boolean {
        return GITHUB_LINK_REGEX().test(url)
    }

    private injectGithubToken(url: string): string {
        if (!this.checkIfGithubCredentialsExist()) {
            return url
        }
        return url.replace('https://', `https://${GITHUB_TOKEN()}@`)
    }

    private importDLCPreset(type: presetTypes, full_descriptor: string): DLCPreset | null {
        try {
            const dlc = fs.readdirSync(PATH_TO_INSTALLED_PACKAGES)
            for (const folder of dlc) {
                const folderPath = path.join(PATH_TO_INSTALLED_PACKAGES, folder)
                const dlcFiles = fs.readdirSync(folderPath)
                if (dlcFiles.includes('data')) {
                    const data = fs.readdirSync(path.join(folderPath, 'data'))
                    if (data.includes(type)) {
                        const presetJson = fs.readFileSync(path.join(folderPath, 'data', type), 'utf-8')
                        const presets = JSON.parse(presetJson)
                        for (const preset of presets) {
                            // we cache ALL preset from imported DLC file for future use
                            this.cachedPresets[folder][type][preset.descriptor] = preset
                        }
                        return this.cachedPresets[folder][type][full_descriptor] as DLCPreset
                    }
                    return null
                }
            }
            return null
        } catch (e) {
            console.log('Error importing preset', e)
            return null
        }
    }

    private importMultiple(type: presetTypes, descriptors: Array<string>): Array<DLCPreset> | null {
        try {
            const dlc = fs.readdirSync(PATH_TO_INSTALLED_PACKAGES)
            for (const folder of dlc) {
                const folderPath = path.join(PATH_TO_INSTALLED_PACKAGES, folder)
                const dlcFiles = fs.readdirSync(folderPath)
                if (dlcFiles.includes('data')) {
                    const data = fs.readdirSync(path.join(folderPath, 'data'))
                    if (data.includes(type)) {
                        const presetJson = fs.readFileSync(path.join(folderPath, 'data', type), 'utf-8')
                        const presets = JSON.parse(presetJson)
                        for (const preset of presets) {
                            this.cachedPresets[folder][type][preset.descriptor] = preset
                        }
                        return descriptors.map((descriptor) => this.cachedPresets[folder][type][descriptor])
                    }
                    return null
                }
            }
            return null
        } catch (e) {
            console.log('Error importing preset', e)
            return null
        }
    }

    public getDLCWeapons(descriptors: Array<string>) {
        return this.importMultiple('weapons', descriptors)
    }

    public getDLCWeapon(descriptor: string) {
        return this.importDLCPreset('weapons', descriptor)
    }

    public getDLCSpells(descriptors: Array<string>) {
        return this.importMultiple('spells', descriptors)
    }

    public getDLCSpell(descriptor: string) {
        return this.importDLCPreset('spells', descriptor)
    }

    public getDLCItems(descriptors: Array<string>) {
        return this.importMultiple('items', descriptors)
    }

    public getDLCItem(descriptor: string) {
        return this.importDLCPreset('items', descriptor)
    }

    public getDLCStatusEffects(descriptors: Array<string>) {
        return this.importMultiple('status_effects', descriptors)
    }

    public getDLCStatusEffect(descriptor: string) {
        return this.importDLCPreset('status_effects', descriptor)
    }
}

export default new PackageManagerService()
