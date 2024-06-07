export interface Manifest {
    title: string
    description: string
    version: string
    descriptor: string
    author: string
    source: string // git repository url
}

export interface GameServerStatus {
    installed: Array<Manifest>
}

export interface SpellPreset {}
export interface WeaponPreset {}
export interface ItemPreset {}
export interface StatusEffectPreset {}
export interface EntityPreset {}

export type DLCPreset = SpellPreset | WeaponPreset | ItemPreset | StatusEffectPreset | EntityPreset
