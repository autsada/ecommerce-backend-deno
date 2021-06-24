import { Pool, PoolClient } from '../deps.ts'

// const { PGAPPNAME, PGDATABASE, PGUSER, PGPASSWORD, PGHOST, PGPORT } = config()
const PGAPPNAME = Deno.env.get('PGAPPNAME')
const PGDATABASE = Deno.env.get('PGDATABASE')
const PGUSER = Deno.env.get('PGUSER')
const PGPASSWORD = Deno.env.get('PGPASSWORD')
const PGHOST = Deno.env.get('PGHOST')
const PGPORT = Deno.env.get('PGPORT')

const POOL_CONNECTIONS = 20

// const pool = new Pool(
//     {
//         applicationName: PGAPPNAME,
//         database: PGDATABASE,
//         user: PGUSER,
//         password: PGPASSWORD,
//         hostname: PGHOST,
//         port: +PGPORT,
//         tls: {
//             enforce: false,
//         },
//     },
//     POOL_CONNECTIONS
// )

const pool = new Pool(
    {
        applicationName: PGAPPNAME,
        database: PGDATABASE,
        user: PGUSER,
        password: PGPASSWORD,
        hostname: PGHOST,
        port: PGPORT || 5432,
        tls: {
            enforce: true,
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
