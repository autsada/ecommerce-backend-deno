import { Router } from '../deps.ts'

import { isAuthenticated } from '../middlewares/isAuthenticated.ts'
import { isAuthorized } from '../middlewares/isAuthorized.ts'
import { myProfile, signout } from '../controllers/me.ts'

export const meRouter = new Router({ prefix: '/me' })

meRouter.get(
  '/',
  isAuthenticated,
  // isAuthorized(['CLIENT', 'ADMIN', 'SUPER_ADMIN']),
  myProfile
)
meRouter.post(
  '/signout',
  isAuthenticated,
  isAuthorized(['CLIENT', 'ADMIN', 'SUPER_ADMIN']),
  signout
)
// meRouter.post('/renew-token', isAuthenticated, renewAccessToken)
