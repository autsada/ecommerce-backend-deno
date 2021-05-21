import { Router } from '../deps.ts'

import { isAuthenticated } from '../middlewares/isAuthenticated.ts'
import { isAuthorized } from '../middlewares/isAuthorized.ts'
import {
  selectAddress,
  checkout,
  // confirmPayment,
  listCards,
  setDefaultCard,
  removeCard,
} from '../controllers/checkout.ts'

export const checkoutRouter = new Router({ prefix: '/checkout' })

checkoutRouter.post(
  '/select-address',
  isAuthenticated,
  isAuthorized(['CLIENT']),
  selectAddress
)
checkoutRouter.post('/', isAuthenticated, isAuthorized(['CLIENT']), checkout)
// checkoutRouter.post(
//   '/confirm-payment',
//   isAuthenticated,
//   isAuthorized(['CLIENT']),
//   confirmPayment
// )
checkoutRouter.get(
  '/list-cards',
  isAuthenticated,
  isAuthorized(['CLIENT']),
  listCards
)
checkoutRouter.post(
  '/set-default-card',
  isAuthenticated,
  isAuthorized(['CLIENT']),
  setDefaultCard
)
checkoutRouter.delete(
  '/remove-card',
  isAuthenticated,
  isAuthorized(['CLIENT']),
  removeCard
)
