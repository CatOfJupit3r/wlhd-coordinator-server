import { TurnOrder } from '@models/GameSaveModels'
import {
    Battlefield,
    CharacterInfo,
    GameHandshake as GameHandshakeGameServer,
    GameStateContainer,
    iCharacterAction,
} from '@models/ServerModels'
import { TranslatableString } from '@models/Translation'
import { iPlayer } from '@services/CombatConnection/PlayerInGame'

class GameState {
    public roundCount: number
    public messages: GameStateContainer
    public battleResult: 'pending' | 'ongoing'
    public currentBattlefield: Battlefield
    public allCharactersInfo: { [characterId: string]: CharacterInfo }
    public turnInfo: GameHandshakeGameServer['turnInfo'] & { actionTimeStamp: null | number }

    constructor() {
        this.roundCount = 0
        this.messages = []
        this.battleResult = 'pending'
        this.currentBattlefield = { pawns: {} }
        this.allCharactersInfo = {}
        this.turnInfo = {
            actions: null,
            playerId: null,
            order: [null],
            actionTimeStamp: null,
        }
    }

    public fromHandshake = (handshake: GameHandshakeGameServer) => {
        const { roundCount, battlefield, turnInfo, messages, combatStatus, allCharactersInfo } = handshake

        this.roundCount = roundCount
        this.messages = messages
        this.battleResult = combatStatus
        this.currentBattlefield = battlefield
        this.allCharactersInfo = allCharactersInfo
        this.turnInfo = {
            ...turnInfo,
            actionTimeStamp: null,
        }
    }

    public getRoundCount = (): number => {
        return this.roundCount
    }

    public updateTimeStamp = () => {
        this.turnInfo.actionTimeStamp = Date.now()
    }

    public resetTurnInfo = () => {
        this.turnInfo = {
            ...this.turnInfo,
            actionTimeStamp: null,
            playerId: null,
        }
    }

    public setTurnOrder = (order: TurnOrder) => {
        this.turnInfo = {
            ...this.turnInfo,
            order,
        }
    }

    public isOngoing = () => this.battleResult === 'ongoing'

    public setBattleResult = (status: 'ongoing' | 'pending' | string) => {
        if (status === 'pending' || status === 'ongoing') {
            this.battleResult = status
        }
    }

    public addNewMessage(newMessage: Array<TranslatableString>) {
        this.messages = [...this.messages, newMessage]
    }

    public updateBattlefield(newBattlefield: Battlefield) {
        this.currentBattlefield = newBattlefield
    }

    public updateRoundCount(newRoundCount: number) {
        this.roundCount = newRoundCount
    }

    public updateCharactersInfo(newCharacterData: { [square: string]: CharacterInfo }) {
        this.allCharactersInfo = {
            ...this.allCharactersInfo,
            ...newCharacterData,
        }
    }

    public updateCharacterActions(actions: iCharacterAction) {
        if (this.turnInfo.order[0] === null) {
            return
        }
        this.turnInfo.actions = actions
    }

    public isPlayersTurn = (player: iPlayer): boolean => {
        return this.battleResult === 'ongoing' && this.isPlayerIdTurn(player.id) && this.turnInfo.order !== null
    }

    public isPlayerIdTurn = (playerId: string): boolean => {
        return this.turnInfo.playerId === playerId
    }

    public currentCharacterId = (): string | null => {
        return this.turnInfo.order ? this.turnInfo.order[0] : null
    }

    public setCurrentCharacterId = (characterId: string) => {
        this.turnInfo.order[0] = characterId
    }

    public getCharacterOnSquare = (square: { line: number; column: number }): CharacterInfo | null => {
        return (
            Object.values(this.allCharactersInfo).find(
                (character) =>
                    character && character.square.line === square.line && character.square.column === square.column
            ) ?? null
        )
    }

    public getCharacterById = (id: string): CharacterInfo | null => {
        return this.allCharactersInfo[id] ?? null
    }
}

export default GameState
