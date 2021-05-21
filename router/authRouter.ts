import { Router } from '../deps.ts'

import {
  signup,
  signin,
  resetPassword,
  confirmResetPassword,
} from '../controllers/auth.ts'

export const authRouter = new Router({ prefix: '/auth' })

// '/auth/signup'
authRouter.post('/signup', signup)
authRouter.post('/signin', signin)
authRouter.post('/reset-password', resetPassword)
authRouter.post('/confirm-reset-password', confirmResetPassword)
