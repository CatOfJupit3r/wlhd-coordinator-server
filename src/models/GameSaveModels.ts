import { CharacterPreset } from './GameDLCData'
import { TranslatableString } from './Translation'

interface ControlledByPrototype {
    type: string
    id?: string | null
}

interface ControlledByPlayer extends ControlledByPrototype {
    type: 'player'
    id: string | null
}

interface ControlledByAI extends ControlledByPrototype {
    type: 'ai'
    id: string
}

interface ControlledByGameLogic extends ControlledByPrototype {
    type: 'game_logic'
    id?: null
}

export type ControlInfo = ControlledByPlayer | ControlledByAI | ControlledByGameLogic | ControlledByPrototype

type CharacterSaveSource = Partial<CharacterPreset> & { id_: string }

export type CharacterOnSquare = {
    descriptor: string
    source: CharacterSaveSource
    control: ControlInfo
}

export type TurnOrder = Array<string | null> // Array with many strings and (ideally) one null (indicating the end of the round)

export interface GameSave {
    round: number
    turnOrder: TurnOrder
    battlefield: { [square: string]: CharacterOnSquare | null }
    messages: Array<Array<TranslatableString>>
}
