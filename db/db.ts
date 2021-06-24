import { Pool, PoolClient, config } from '../deps.ts'

const { DB_DATABASE, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = config()

const POOL_CONNECTIONS = 20

const pool = new Pool(
    {
        database: DB_DATABASE,
        user: DB_USER,
        password: DB_PASSWORD,
        hostname: DB_HOST,
        port: +DB_PORT,
        tls: {
            enforce: false,
        },
    },
    POOL_CONNECTIONS
)

export async function runQuery<T extends {}>(query: string) {
    const client: PoolClient = await pool.connect()
    const result = await client.queryObject<T>(query)
    client.release()

    return result
}
