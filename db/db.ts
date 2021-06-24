import { Pool, PoolClient, config } from '../deps.ts'

const { DATABASE_URL } = config()

const POOL_CONNECTIONS = 20
// const pool = new Pool(
//     {
//         database: DB_DATABASE,
//         user: DB_USER,
//         password: DB_PASSWORD,
//         hostname: DB_HOST,
//         port: +DB_PORT,
//     },
//     POOL_CONNECTIONS
// )

const pool = new Pool(DATABASE_URL, POOL_CONNECTIONS)

export async function runQuery<T extends {}>(query: string) {
    const client: PoolClient = await pool.connect()
    const result = await client.queryObject<T>(query)
    client.release()

    return result
}
