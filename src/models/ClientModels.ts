import {
    ControlInfo,
    GameComponentDecoration,
    GameStateContainer,
    ItemInfo,
    SpellInfo,
    StatusEffectInfo,
    WeaponInfo,
} from './ServerModels'

export interface BattlefieldPlayers {
    pawns: {
        [key: string]: {
            character: EntityInfoTooltip | null
            areaEffects: Array<unknown>
        }
    }
}

export interface GameHandshake {
    roundCount: number
    messages: GameStateContainer // but only last 10 instead of all
    combatStatus: 'ongoing' | 'pending'
    currentBattlefield: BattlefieldPlayers
    controlledEntities: Array<EntityInfoFull> | null
    turnOrder: IndividualTurnOrder
}

export interface EntityInfoTooltip {
    decorations: GameComponentDecoration
    square: { line: number; column: number }
    health: { current: number; max: number }
    action_points: { current: number; max: number }
    armor: { current: number; base: number }
    statusEffects: Array<Omit<StatusEffectInfo, 'descriptor'>>
}

export interface EntityInfoFull {
    decorations: GameComponentDecoration
    square: { line: number; column: number }
    attributes: { [attribute: string]: number }

    inventory: Array<ItemInfo>
    weaponry: Array<WeaponInfo>
    spellBook: {
        spells: Array<SpellInfo>
        maxActiveSpells: number | null
    }
    statusEffects: Array<StatusEffectInfo>
}

export interface TurnOrder {
    order: Array<CharacterInTurnOrder>
    current: number | null
}

export interface IndividualTurnOrder {
    order: Array<CharacterInTurnOrderPlayer>
    current: number | null
}

export interface CharacterInTurnOrder {
    controlledBy: ControlInfo
    descriptor: string
    decorations: {
        name: string
        description: string
        sprite: string
    }
    square: {
        line: number
        column: number
    }
}

export type CharacterInTurnOrderPlayer = Omit<CharacterInTurnOrder, 'controlledBy'> & {
    controlledByYou: boolean
}
