import { Router } from '../deps.ts'

import { isAuthenticated } from '../middlewares/isAuthenticated.ts'
import { isAuthorized } from '../middlewares/isAuthorized.ts'
import {
  listUserCart,
  addToCart,
  updateCart,
  deleteCartItem,
} from '../controllers/cart.ts'

export const cartRouter = new Router({ prefix: '/cart' })

cartRouter.get('/', isAuthenticated, isAuthorized(['CLIENT']), listUserCart)
cartRouter.post('/', isAuthenticated, isAuthorized(['CLIENT']), addToCart)
cartRouter.post(
  '/:cartItemId',
  isAuthenticated,
  isAuthorized(['CLIENT']),
  updateCart
)
cartRouter.delete(
  '/:cartItemId',
  isAuthenticated,
  isAuthorized(['CLIENT']),
  deleteCartItem
)
