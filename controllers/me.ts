import { RouterMiddleware } from '../deps.ts'

import { runQuery } from '../db/db.ts'
import { removeSessionById, insertSession } from '../db/query.ts'
import {
  deleteToken,
  handleTokens,
  verifyAccessToken,
} from '../utils/tokens.ts'

export const myProfile: RouterMiddleware = async (ctx) => {
  const { request, response, cookies } = ctx

  if (request.user && request.sessionId) {
    // Get the access token from an authorization header of the request
    const authorization = request.headers.get('authorization') // 'Bearer boaitboe'
    const accessToken = authorization
      ? authorization.split(' ')[1]
      : authorization

    // Verify the access token
    const accessPayload = await verifyAccessToken(accessToken || '')

    // 1. If the access token is expired, 2. If the remaining expiration time is less than 30 seconds
    if (!accessPayload || accessPayload.exp * 1000 - Date.now() < 1000 * 30) {
      // Issue a new access token
      // 1. Create a new session
      const insertSessionResult = await runQuery<{
        id: string
        owner_id: string
      }>(insertSession(request.user.id))
      const newSession = insertSessionResult.rows[0]

      if (!newSession) {
        ctx.throw(500)
        return
      }

      // 2. Issue a new refresh token
      // 3. Set the refresh token in cookies
      // 4. Issue a new access token
      const newAccessToken = await handleTokens(
        newSession.id,
        newSession.owner_id,
        cookies
      )

      // 5. Invalidate the current refresh token --> delete the session of the current refresh token
      await runQuery(removeSessionById(request.sessionId))
      response.body = { user: request.user, accessToken: newAccessToken }
    } else {
      response.body = { user: request.user, accessToken }
    }
  } else {
    response.body = { user: null }
  }
}

export const signout: RouterMiddleware = async (ctx) => {
  try {
    const { request, response, cookies } = ctx

    if (!request.sessionId) {
      ctx.throw(401)
      return
    }

    // Delete session from the database
    await runQuery(removeSessionById(request.sessionId))

    // Delete the refresh token from cookies
    deleteToken(cookies)

    response.body = { message: 'You are logged out.' }
  } catch (error) {
    throw error
  }
}

// export const renewAccessToken: RouterMiddleware = async (ctx) => {
//   try {
//     const { request, cookies, response } = ctx

//     if (!request.user || !request.sessionId) {
//       ctx.throw(401)
//       return
//     }

//     // 1. Create a new session
//     const insertSessionResult = await runQuery<{
//       id: string
//       owner_id: string
//     }>(insertSession(request.user.id))
//     const newSession = insertSessionResult.rows[0]

//     if (!newSession) {
//       ctx.throw(500)
//       return
//     }

//     // 2. Issue a new refresh token
//     // 3. Set the refresh token in cookies
//     // 4. Issue a new access token
//     const accessToken = await handleTokens(
//       newSession.id,
//       newSession.owner_id,
//       cookies
//     )

//     // 5. Invalidate the current refresh token --> delete the session of the current refresh token
//     await runQuery(removeSessionById(request.sessionId))

//     // 6. Send the access token to requestor
//     response.body = { accessToken }
//   } catch (error) {
//     throw error
//   }
// }
