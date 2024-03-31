import bcrypt from 'bcrypt'
import { omit } from 'lodash'
import { Types } from 'mongoose'
import { UserClass } from '../models/userModel'
import AuthService from './AuthService'
import { createNewUser, getJoinedLobbiesInfo, getUser, getUserByHandle } from './DatabaseService'

class UsersService {
    #privateFields = ['hashedPassword']

    #omitPrivateFields = (user: any) => omit(user, this.#privateFields)

    async createAccount({ handle, password }: { handle: string; password: string }) {
        const user = await this.findByHandle(handle, false)
        if (user) throw new Error(`User with handle ${handle} is already registered`)

        const hashedPassword = await bcrypt.hash(password, 10)

        const _id = await createNewUser(handle, hashedPassword)

        console.log(`Registered new user with handle: ${handle}. Id: ${_id}`)
    }

    async loginWithPassword({ handle, password }: { handle: string; password: string }) {
        const user = (await this.findByHandle(handle, true)) as UserClass

        if (!user) throw new Error('User not found')

        console.log('User found:', user)
        console.log('Password:', password)

        const isPasswordCorrect = await bcrypt.compare(password, user.hashedPassword)
        if (!isPasswordCorrect) throw new Error('Incorrect password')

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

    async getJoinedLobbiesInfo(token: string) {
        const decoded = AuthService.verifyAccessToken(token)
        const user = await getUser(decoded._id)
        if (!user) throw new Error('User not found')
        return getJoinedLobbiesInfo(decoded._id)
    }

    async findById(_id: string, shouldIncludePrivateFields: boolean) {
        const user = await getUser(_id)
        if (!user) return null
        if (shouldIncludePrivateFields) return user
        return this.#omitPrivateFields(user)
    }

    async findByHandle(handle: string, shouldIncludePrivateFields: boolean) {
        const user = await getUserByHandle(handle)
        if (!user) {
            return null
        }
        if (shouldIncludePrivateFields) {
            return user
        }
        return this.#omitPrivateFields(user)
    }
}

export default new UsersService()
