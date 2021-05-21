import { Router } from '../deps.ts'

import { isAuthenticated } from '../middlewares/isAuthenticated.ts'
import { isAuthorized } from '../middlewares/isAuthorized.ts'
import {
  addProduct,
  updateProduct,
  deleteProduct,
  listOrders,
  getOrder,
  updateOrder,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
} from '../controllers/admin.ts'

export const adminRouter = new Router({ prefix: '/admin' })

adminRouter.post(
  '/products',
  isAuthenticated,
  isAuthorized(['ADMIN', 'SUPER_ADMIN']),
  addProduct
)
adminRouter.post(
  '/products/:productId',
  isAuthenticated,
  isAuthorized(['ADMIN', 'SUPER_ADMIN']),
  updateProduct
)
adminRouter.delete(
  '/products/:productId',
  isAuthenticated,
  isAuthorized(['SUPER_ADMIN']),
  deleteProduct
)
adminRouter.get(
  '/orders',
  isAuthenticated,
  isAuthorized(['ADMIN', 'SUPER_ADMIN']),
  listOrders
)
adminRouter.get(
  '/orders/:orderId',
  isAuthenticated,
  isAuthorized(['ADMIN', 'SUPER_ADMIN']),
  getOrder
)
adminRouter.post(
  '/orders/:orderId',
  isAuthenticated,
  isAuthorized(['ADMIN', 'SUPER_ADMIN']),
  updateOrder
)

adminRouter.get(
  '/users',
  isAuthenticated,
  isAuthorized(['ADMIN', 'SUPER_ADMIN']),
  listUsers
)
adminRouter.get(
  '/users/:userId',
  isAuthenticated,
  isAuthorized(['ADMIN', 'SUPER_ADMIN']),
  getUser
)
adminRouter.post(
  '/users/:userId',
  isAuthenticated,
  isAuthorized(['SUPER_ADMIN']),
  updateUser
)
adminRouter.delete(
  '/users/:userId',
  isAuthenticated,
  isAuthorized(['SUPER_ADMIN']),
  deleteUser
)
