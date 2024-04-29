import DatabaseService from '../services/DatabaseService'

const DatabaseLoader = async () => {
    await DatabaseService.connect()
}

export default DatabaseLoader
