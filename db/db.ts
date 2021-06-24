import { Pool, PoolClient, config } from '../deps.ts'

const { PGAPPNAME, PGDATABASE, PGUSER, PGPASSWORD, PGHOST, PGPORT } = config()

const POOL_CONNECTIONS = 20

const pool = new Pool(
    {
        applicationName: PGAPPNAME,
        database: PGDATABASE,
        user: PGUSER,
        password: PGPASSWORD,
        hostname: PGHOST,
        port: +PGPORT,
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
