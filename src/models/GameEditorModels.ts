export interface EntityInfoFullToCharacterClass {
    decorations: {
        name: string
        description: string
        sprite: string
    }
    attributes: Array<{
        descriptor: string
        value: number
    }>
    spellBook: {
        maxActiveSpells: number | null
        knownSpells: Array<{
            descriptor: string
            isActive: boolean
        }>
    }
    inventory: Array<{
        descriptor: string
        quantity: number
    }>
    statusEffects: Array<{
        descriptor: string
        duration: number | null
    }>
    weaponry: Array<{
        descriptor: string
        quantity: number
    }>
}
