import { Router } from '../deps.ts'

import { isAuthenticated } from '../middlewares/isAuthenticated.ts'
import { isAuthorized } from '../middlewares/isAuthorized.ts'
import {
  listUserAddresses,
  addAddress,
  getAddress,
  updateAddress,
  deleteAddress,
} from '../controllers/addresses.ts'

export const addressesRouter = new Router({ prefix: '/addresses' })

addressesRouter.get(
  '/',
  isAuthenticated,
  isAuthorized(['CLIENT']),
  listUserAddresses
)
addressesRouter.get(
  '/:addressId',
  isAuthenticated,
  isAuthorized(['CLIENT']),
  getAddress
)
addressesRouter.post('/', isAuthenticated, isAuthorized(['CLIENT']), addAddress)
addressesRouter.post(
  '/:addressId',
  isAuthenticated,
  isAuthorized(['CLIENT']),
  updateAddress
)
addressesRouter.delete(
  '/:addressId',
  isAuthenticated,
  isAuthorized(['CLIENT']),
  deleteAddress
)
