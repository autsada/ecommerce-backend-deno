import { RouterMiddleware } from '../deps.ts'

import { runQuery } from '../db/db.ts'
import { fetchSessionById, fetchUserById } from '../db/query.ts'
import { User } from '../types/types.ts'

export const isAuthenticated: RouterMiddleware = async (ctx, next) => {
  const { request } = ctx
  // Check if the refresh token is verified
  if (request.sessionId) {
    // Check if the sessionId exists in the sessions table in the database
    const result = await runQuery<{ id: string; owner_id: string }>(
      fetchSessionById(request.sessionId)
    )
    const session = result.rows[0]

    if (session) {
      // Check if user exists in the users table in the database
      const fetchUserResult = await runQuery<User>(
        fetchUserById(session.owner_id)
      )
      const user = fetchUserResult.rows[0]

      if (user) {
        // User is authenticated
        request.user = user
      }
    }
  }

  await next()
}
