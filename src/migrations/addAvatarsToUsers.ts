import { UserModel } from '@models/TypegooseModels'
import DatabaseService from '@services/DatabaseService'
import { RandomUtils } from '@utils'

const migrations: (() => Promise<void>)[] = [
    // NAME: Add avatars to users
    // DESCRIPTION: Adds avatars to users that don't have one
    async () => {
        await DatabaseService.connect()
        const users = await UserModel.find()
        for (const user of users) {
            if (user.avatar) {
                continue
            }
            user.avatar = {
                preferred: 'static',
                url: '',
                generated: {
                    pattern: RandomUtils.generateAvatarString(),
                    mainColor: 'red',
                    secondaryColor: 'blue',
                },
            }
            await user.save()
        }
    },

    // NAME: replace mainColor and secondaryColor with HEX colors
    // DESCRIPTION: Replaces the mainColor and secondaryColor with HEX colors
    async () => {
        await DatabaseService.connect()
        const users = await UserModel.find()
        for (const user of users) {
            if (!user.avatar) {
                continue
            }
            // check if the colors are already in HEX format
            const [mainColor, secondaryColor] = RandomUtils.createTwoRandomColors()
            if (!user.avatar.generated.mainColor.startsWith('#')) {
                user.avatar.generated.mainColor = mainColor
            }
            if (!user.avatar.generated.secondaryColor.startsWith('#')) {
                user.avatar.generated.secondaryColor = secondaryColor
            }
            await user.save()
        }
    },

    // NAME: remove _id from AvatarHandler
    // DESCRIPTION: Removes the _id field from the AvatarHandler schema
    async () => {
        await DatabaseService.connect()
        const users = await UserModel.find()
        for (const user of users) {
            if (!user.avatar) {
                continue
            }
            const { _id: _, ...avatar } = user.avatar as any
            user.avatar = avatar
            const { _id: __, ...generated } = user.avatar.generated as any
            user.avatar.generated = generated
            await user.save()
        }
    },
]

export default migrations
