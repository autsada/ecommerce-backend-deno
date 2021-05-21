import { RouterMiddleware } from '../deps.ts'

import { Role } from '../types/types.ts'

import { verifyAccessToken } from '../utils/tokens.ts'

export const isAuthorized = (permissions: Role[]): RouterMiddleware => async (
  ctx,
  next
) => {
  const { request } = ctx

  // Re-check if the request is authenticated
  if (!request.user) {
    ctx.throw(401)
    return
  }

  // Check if user has permission
  const hasPermission = permissions.includes(request.user.role)

  if (!hasPermission) {
    ctx.throw(403)
    return
  }

  // Get the access token from an authorization header of the request
  const authorization = request.headers.get('authorization') // 'Bearer boaitboe'
  const accessToken = authorization
    ? authorization.split(' ')[1]
    : authorization

  if (!accessToken) {
    ctx.throw(401)
    return
  }

  // Verify the access token
  const accessPayload = await verifyAccessToken(accessToken)

  if (!accessPayload) {
    ctx.throw(401)
    return
  }

  // Check if the user id is correct
  if (accessPayload.userId !== request.user.id) {
    ctx.throw(401)
    return
  }

  await next()
}
