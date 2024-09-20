import { Forbidden, NotFound } from '@models/ErrorModels'
import { UserClass } from '@models/TypegooseModels'
import bcrypt from 'bcrypt'
import { omit } from 'lodash'
import { Types } from 'mongoose'
import AuthService from './AuthService'
import DatabaseService from './DatabaseService'

class UserService {
    #privateFields = ['hashedPassword']

    #omitPrivateFields = (user: UserClass) => omit(user, this.#privateFields)

    async createAccount({ handle, password }: { handle: string; password: string }) {
        const user = await this.findByHandle(handle, false)
        if (user) throw new Error(`User with handle ${handle} is already registered`)

        const hashedPassword = await bcrypt.hash(password, 10)

        const _id = await DatabaseService.createNewUser(handle, hashedPassword)

        console.log(`Registered new user with handle: ${handle}. Id: ${_id}`)
    }

    async loginWithPassword({ handle, password }: { handle: string; password: string }) {
        const user = (await this.findByHandle(handle, true)) as UserClass

        if (!user) throw new NotFound('User not found')

        const isPasswordCorrect = await bcrypt.compare(password, user.hashedPassword)
        if (!isPasswordCorrect) throw new Forbidden('Incorrect password')

        const userWithoutPrivateFields = this.#omitPrivateFields(user)

        const accessToken = AuthService.generateAccessToken(
            userWithoutPrivateFields as { _id: Types.ObjectId; handle: string }
        )
        const refreshToken = AuthService.generateRefreshToken(
            userWithoutPrivateFields as { _id: Types.ObjectId; handle: string }
        )

        return { accessToken, refreshToken, user: userWithoutPrivateFields }
    }

    loginWithRefreshToken(refreshToken: string) {
        const accessToken = AuthService.issueNewAccessToken(refreshToken)
        return { accessToken }
    }

    logout(refreshToken: string) {
        AuthService.invalidateRefreshToken(refreshToken)
    }

    async getJoinedLobbies(user_id: string): Promise<Array<string>> {
        const user = await DatabaseService.getUser(user_id)
        if (!user) throw new NotFound('User not found')

        return (await DatabaseService.getLobbiesWithPlayer(user_id)).map((lobby) => lobby._id.toString())
    }

    async getProfile(user_id: string) {
        const user = await DatabaseService.getUser(user_id)
        if (!user) throw new NotFound('User not found')
        return user
    }

    async findById(_id: string, shouldIncludePrivateFields: boolean) {
        const user = await DatabaseService.getUser(_id)
        if (!user) return null
        if (shouldIncludePrivateFields) return user
        return this.#omitPrivateFields(user)
    }

    async findByHandle(handle: string, shouldIncludePrivateFields: boolean) {
        const user = await DatabaseService.getUserByHandle(handle)
        if (!user) {
            return null
        }
        if (shouldIncludePrivateFields) {
            return user
        }
        return this.#omitPrivateFields(user)
    }
}

export default new UserService()
