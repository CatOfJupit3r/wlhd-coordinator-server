import fs from 'fs'
import { simpleGit, SimpleGit } from 'simple-git'
import { PATH_TO_INSTALLED_PACKAGES } from '../configs/config'
import { Manifest } from '../models/dlc_manifest'

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

    constructor() {
        this.git = simpleGit({
            baseDir: PATH_TO_INSTALLED_PACKAGES,
            binary: 'git',
            maxConcurrentProcesses: 6,
        })
        this.checkInstallationFolder()
    }

    private checkIfGithubCredentialsExist() {
        return !!process.env.GITHUB_TOKEN
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
        const packagePath = `${PATH_TO_INSTALLED_PACKAGES}/${packageName}`
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
        await this.git.clone(source, dir)
    }

    private async gitPull(packagePath: string) {
        const dir = `${PATH_TO_INSTALLED_PACKAGES}/${packagePath}`
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
            const folderPath = `${PATH_TO_INSTALLED_PACKAGES}/${folder}`
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
            const folderPath = `${PATH_TO_INSTALLED_PACKAGES}/${folder}`
            const dlcFiles = fs.readdirSync(folderPath)
            if (!dlcFiles.includes('manifest.json')) {
                console.log(`Manifest not found for package ${folder}`)
                fs.rmSync(folderPath, { recursive: true })
            } else {
                const manifest = JSON.parse(fs.readFileSync(`${folderPath}/manifest.json`, 'utf-8'))
                if (!manifest.descriptor || !manifest.source) {
                    console.log(`Invalid manifest for package ${folder}`)
                    fs.rmSync(folderPath, { recursive: true })
                }
            }
        }
    }

    private verifyGithubLink(url: string): boolean {
        const githubLink = /https?:\/\/github\.com\/(?:[^/\s]+\/)+(?:wlhd-[A-Za-z]+-package|)/gm
        return githubLink.test(url)
    }
}

export default new PackageManagerService()
