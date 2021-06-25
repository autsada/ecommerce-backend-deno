import { Pool, PoolClient } from '../deps.ts'

const PGAPPNAME = Deno.env.get('PGAPPNAME')
const PGDATABASE = Deno.env.get('PGDATABASE')
const PGUSER = Deno.env.get('PGUSER')
const PGPASSWORD = Deno.env.get('PGPASSWORD')
const PGHOST = Deno.env.get('PGHOST')
const PGPORT = Deno.env.get('PGPORT')

const POOL_CONNECTIONS = 20

const pool = new Pool(
    {
        applicationName: PGAPPNAME,
        database: PGDATABASE,
        user: PGUSER,
        password: PGPASSWORD,
        hostname: PGHOST,
        port: PGPORT || 5432,
    },
    POOL_CONNECTIONS
)

export async function runQuery<T extends {}>(query: string) {
    const client: PoolClient = await pool.connect()
    const result = await client.queryObject<T>(query)
    client.release()

    return result
}
