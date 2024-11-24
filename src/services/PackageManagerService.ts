import fs from 'fs'
import path from 'path'

import { PATH_TO_INSTALLED_PACKAGES } from '@configs'
import {
    CharacterPreset,
    DLCPreset,
    ItemPreset,
    SpellPreset,
    StatusEffectPreset,
    WeaponPreset,
} from '@models/GameDLCData'

type presetTypes = 'weapons' | 'spells' | 'items' | 'status_effects' | 'entities'

class PackageManagerService {
    private availableDLCs: Array<string>
    private cachedPresets: {
        [dlc: string]: { [type: presetTypes | string]: { [descriptor: string]: DLCPreset | null } }
    } = {
        builtins: {
            weapons: {},
            spells: {},
            items: {},
            status_effects: {},
            entities: {},
        },
    }

    constructor() {
        this.checkInstallationFolder()
    }

    private checkInstallationFolder() {
        console.log('Checking installation folder...')
        if (!fs.existsSync(PATH_TO_INSTALLED_PACKAGES)) {
            console.log('Installation folder not found, creating...')
            fs.mkdirSync(PATH_TO_INSTALLED_PACKAGES)
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

    private importDLCPreset(type: presetTypes, full_descriptor: string): DLCPreset | null {
        try {
            const [dlc, descriptor] = full_descriptor.split(':')
            if (!dlc || !descriptor) {
                console.log('Somehow, descriptor does not follow regex pattern. Look into it: ', full_descriptor)
                return null
            }
            if (this.cachedPresets[dlc]?.[type]?.[descriptor] !== undefined) {
                return this.cachedPresets[dlc][type][descriptor]
            }
            this.cacheDLCPresets(dlc)
            return (this.cachedPresets[dlc]?.[type]?.[descriptor] as DLCPreset) || null
        } catch (e) {
            console.log('Error importing preset', e)
            return null
        }
    }

    public cacheDLCPresets(dlc: string) {
        const dlcFolderPath = path.join(PATH_TO_INSTALLED_PACKAGES, dlc)
        const dlcFolder = fs.readdirSync(dlcFolderPath)
        if (dlcFolder.includes('data')) {
            const data = fs.readdirSync(path.join(dlcFolderPath, 'data'))
            for (const presetFileName of data) {
                const type = presetFileName.split('.')[0]
                const presetJson = fs.readFileSync(path.join(dlcFolderPath, 'data', presetFileName), 'utf-8')
                const presets = JSON.parse(presetJson)
                this.hydrateCachedPresets(dlc, type as presetTypes)
                for (const descriptor in presets) {
                    this.cachedPresets[dlc][type as presetTypes][descriptor] = {
                        ...presets[descriptor],
                        descriptor: `${dlc}:${descriptor}`,
                    }
                }
            }
        }
    }

    public cacheAllDLCs() {
        this.availableDLCs = fs.readdirSync(PATH_TO_INSTALLED_PACKAGES)
        for (const dlc of this.availableDLCs) {
            this.cacheDLCPresets(dlc)
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

    private presetReducer<T>([key, value]: [string, T | null], acc: { [descriptor: string]: T }) {
        if (value) {
            acc[key] = value as T
        }
        return acc
    }

    public getCachedItems(dlc: string): { [descriptor: string]: ItemPreset } {
        if (!this.cachedPresets[dlc]) {
            return {}
        }
        return Object.entries(this.cachedPresets[dlc].items).reduce((acc, item) => this.presetReducer(item, acc), {})
    }

    public getCachedWeapons(dlc: string): { [descriptor: string]: WeaponPreset } {
        if (!this.cachedPresets[dlc]) {
            return {}
        }
        return Object.entries(this.cachedPresets[dlc].weapons).reduce((acc, item) => this.presetReducer(item, acc), {})
    }

    public getCachedSpells(dlc: string): { [descriptor: string]: SpellPreset } {
        if (!this.cachedPresets[dlc]) {
            return {}
        }
        return Object.entries(this.cachedPresets[dlc].spells).reduce((acc, item) => this.presetReducer(item, acc), {})
    }

    public getCachedStatusEffects(dlc: string): { [descriptor: string]: StatusEffectPreset } {
        if (!this.cachedPresets[dlc]) {
            return {}
        }
        return Object.entries(this.cachedPresets[dlc].status_effects).reduce(
            (acc, item) => this.presetReducer(item, acc),
            {}
        )
    }

    public getCachedCharacters(dlc: string): { [descriptor: string]: CharacterPreset } {
        if (!this.cachedPresets[dlc]) {
            return {}
        }
        return Object.entries(this.cachedPresets[dlc].entities).reduce((acc, item) => this.presetReducer(item, acc), {})
    }

    public checkIfPresetExists(type: presetTypes, full_descriptor: string): boolean {
        if (!full_descriptor) {
            return false
        }
        return !!this.importDLCPreset(type, full_descriptor)
    }

    public isDLCInstalled(dlc: string): boolean {
        return this.availableDLCs.includes(dlc)
    }
}

export default new PackageManagerService()
