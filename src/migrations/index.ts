import addAvatarsToUsers from './addAvatarsToUsers'

const gathered = [...addAvatarsToUsers]

const runMigrations = async () => {
    try {
        for (const migration of gathered) {
            await migration()
        }
        console.log('All migrations ran successfully')
    } catch (e) {
        console.error('Error running migrations', e)
        throw e
    }
}

runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
