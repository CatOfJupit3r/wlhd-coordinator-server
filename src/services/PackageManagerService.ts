import fs from 'fs'
import path from 'path'
import { simpleGit, SimpleGit } from 'simple-git'

import { GITHUB_LINK_REGEX, GITHUB_TOKEN, PATH_TO_INSTALLED_PACKAGES } from '../configs'
import { DLCPreset, ItemPreset, Manifest, SpellPreset, StatusEffectPreset, WeaponPreset } from '../models/GameDLCData'

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
        // SOMEHOW THIS CAN ESCAPE DLC REPO AND RESET WHOLE REPO. I NEARLY LOST 4 HOUR WORTH OF DADA BECAUSE OF THIS WTF
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
            const [dlc, descriptor] = full_descriptor.split(':')
            if (!dlc || !descriptor) {
                console.log('Somehow, descriptor does not follow regex pattern. Look into it: ', full_descriptor)
                return null
            }
            if (this.cachedPresets[dlc] && this.cachedPresets[dlc][type] && this.cachedPresets[dlc][type][descriptor]) {
                return this.cachedPresets[dlc][type][descriptor]
            }
            const dlcFolderPath = path.join(PATH_TO_INSTALLED_PACKAGES, dlc)
            const dlcFolder = fs.readdirSync(dlcFolderPath)
            if (dlcFolder.includes('data')) {
                const data = fs.readdirSync(path.join(dlcFolderPath, 'data'))
                const presetFileName = `${type}.json`
                if (data.includes(presetFileName)) {
                    const presetJson = fs.readFileSync(path.join(dlcFolderPath, 'data', presetFileName), 'utf-8')
                    const presets = JSON.parse(presetJson)
                    this.hydrateCachedPresets(dlc, type)
                    for (const descriptor in presets) {
                        // we cache ALL preset from imported DLC file for future use
                        this.cachedPresets[dlc][type][descriptor] = presets[descriptor]
                    }
                    return (this.cachedPresets[dlc][type][descriptor] as DLCPreset) || null
                }
                return null
            }
            return null
        } catch (e) {
            console.log('Error importing preset', e)
            return null
        }
    }

    private hydrateCachedPresets = (dlc: string, type: presetTypes) => {
        if (!this.cachedPresets[dlc]) {
            this.cachedPresets[dlc] = {
                weapons: {},
                spells: {},
                items: {},
                status_effects: {},
            }
        }
        if (!this.cachedPresets[dlc][type]) {
            this.cachedPresets[dlc][type] = {}
        }
    }

    public resetCache() {
        this.cachedPresets = {
            builtins: {
                weapons: {},
                spells: {},
                items: {},
                status_effects: {},
            },
        }
    }

    public getDLCWeapon(descriptor: string): WeaponPreset | null {
        return this.importDLCPreset('weapons', descriptor) as WeaponPreset
    }

    public getDLCSpell(descriptor: string): SpellPreset | null {
        return this.importDLCPreset('spells', descriptor) as SpellPreset
    }

    public getDLCItem(descriptor: string): ItemPreset | null {
        return this.importDLCPreset('items', descriptor) as ItemPreset
    }

    public getDLCStatusEffect(descriptor: string): StatusEffectPreset | null {
        return this.importDLCPreset('status_effects', descriptor) as StatusEffectPreset
    }
}

export default new PackageManagerService()
