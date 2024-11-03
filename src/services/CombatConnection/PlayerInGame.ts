import DatabaseService from '@services/DatabaseService'
import { Socket as PlayerSocket } from 'socket.io'

export interface iPlayer {
    id: string
    isGm: () => boolean
    isConnected: () => boolean
    hasAssignedSocket: () => boolean
    setSocket: (socket: PlayerSocket) => void
    resetSocket: () => void
    disconnect: () => void
    emit: (event: string, payload?: unknown, callback?: () => void) => void
    getPlayerHandle: () => Promise<string | null>
}

interface iPlayerHelpers {
    getGmId: () => string
}

export class Player implements iPlayer {
    private helpers: iPlayerHelpers
    private _socket: PlayerSocket | null
    private readonly _id_: string

    constructor(socket: PlayerSocket | null, id: string, helpers: iPlayerHelpers) {
        this._socket = socket
        this._id_ = id
        this.helpers = helpers
    }

    public async getPlayerHandle() {
        const user = await DatabaseService.getUser(this._id_)
        return user?.handle ?? null
    }

    public get id() {
        return this._id_
    }

    public setSocket(socket: PlayerSocket) {
        this._socket = socket
        return this
    }

    public resetSocket() {
        if (this._socket && this._socket.connected) {
            this._socket.disconnect()
        }
        this._socket = null
        return this
    }

    public isGm() {
        return this._id_ === this.helpers.getGmId()
    }

    public isConnected = () => this._socket !== null && this._socket.connected

    public hasAssignedSocket() {
        return this._socket !== null
    }

    public emit(event: string, payload?: unknown, callback?: () => void) {
        if (this.isConnected()) {
            this._socket!.emit(event, payload)
            if (callback) {
                callback()
            }
        }
        return this
    }

    public disconnect() {
        if (this.isConnected()) {
            this._socket!.disconnect()
        }
        return this
    }
}
