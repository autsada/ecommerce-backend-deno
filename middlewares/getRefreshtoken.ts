import { Middleware, config } from '../deps.ts'

import { verifyRefreshToken } from '../utils/tokens.ts'

const { TK_NAME } = config()

export const getRefreshToken: Middleware = async (ctx, next) => {
  const { request, cookies } = ctx
  // Get the refresh token from cookies
  const token = cookies.get(TK_NAME)

  // Verify the token
  if (token) {
    const refreshPayload = await verifyRefreshToken(token)

    if (refreshPayload) {
      // Attach the sessionId to the request
      request.sessionId = refreshPayload.sessionId
    }
  }

  await next()
}
