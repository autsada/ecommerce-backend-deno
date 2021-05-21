import { Router } from '../deps.ts'

import { isAuthenticated } from '../middlewares/isAuthenticated.ts'
import { isAuthorized } from '../middlewares/isAuthorized.ts'
import { createOrder, listUserOrders, getOrder } from '../controllers/orders.ts'

export const ordersRouter = new Router({ prefix: '/orders' })

ordersRouter.post('/', isAuthenticated, isAuthorized(['CLIENT']), createOrder)
ordersRouter.get('/', isAuthenticated, isAuthorized(['CLIENT']), listUserOrders)
ordersRouter.get(
  '/:orderId',
  isAuthenticated,
  isAuthorized(['CLIENT']),
  getOrder
)
