interface PerkType {
    skills: Array<{
        type: 'strength' | 'will' | 'reflexes'
        value: string
        // if value is +1, then it adds to current value
        // if value is 1, then it sets to 1
        // if value is -1, then it removes the skill
    }>
    attributes: Array<{
        dlc: string
        descriptor: string
        value: string
    }>
    spells: Array<string>
    statusEffects: Array<string>
    items: Array<string>
    weapons: Array<string>
}

interface LevelPerks {
    major: PerkType
    minor: PerkType
    shared: PerkType
}

interface Progression {
    common: LevelPerks
    third: LevelPerks
    fifth: LevelPerks
    seventh: LevelPerks
    ninth: LevelPerks
    eleventh: LevelPerks
}

export interface SpecialityTreeModel {
    name: string
    description: string
    progression: Progression
    spellBank: Array<{
        descriptor: string
        requiresToUse: Array<string>
        conflictsWith: Array<string>
    }>
}
