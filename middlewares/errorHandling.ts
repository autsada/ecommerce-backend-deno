import { Middleware, isHttpError } from '../deps.ts'

export const errorHandling: Middleware = async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    if (isHttpError(error)) {
      switch (error.status) {
        case 400:
          ctx.response.status = 400
          ctx.response.body = error.message || 'Bad Request'
          break

        case 401:
          ctx.response.status = 401
          ctx.response.body = error.message || 'Unauthorized'
          break

        case 403:
          ctx.response.status = 403
          ctx.response.body = error.message || 'Forbidden'
          break

        case 404:
          ctx.response.status = 404
          ctx.response.body = error.message || 'Not Found'
          break
      }
    } else {
      ctx.response.status = 500
      ctx.response.body = 'Internal Server Error'
    }
  }
}
