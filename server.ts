import { Application, oakCors, config } from './deps.ts'

import { productsRouter } from './router/productsRouter.ts'
import { authRouter } from './router/authRouter.ts'
import { meRouter } from './router/meRouter.ts'
import { cartRouter } from './router/cartRouter.ts'
import { addressesRouter } from './router/addressesRouter.ts'
import { checkoutRouter } from './router/checkoutRouter.ts'
import { ordersRouter } from './router/ordersRouter.ts'
import { adminRouter } from './router/adminRouter.ts'
import { getRefreshToken } from './middlewares/getRefreshtoken.ts'
import { errorHandling } from './middlewares/errorHandling.ts'

const { PORT } = config()

// Application
const app = new Application()

app.use(
  oakCors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
)

// Error Handling Middleware
app.use(errorHandling)

// Products routes (public)
app.use(productsRouter.routes())
app.use(productsRouter.allowedMethods())

// Auth routes (public)
app.use(authRouter.routes())
app.use(authRouter.allowedMethods())

app.use(getRefreshToken)

// Me routes (private)
app.use(meRouter.routes())
app.use(meRouter.allowedMethods())

// Cart routes (private)
app.use(cartRouter.routes())
app.use(cartRouter.allowedMethods())

// Addresses routes (private)
app.use(addressesRouter.routes())
app.use(addressesRouter.allowedMethods())

// Checkout routes (private)
app.use(checkoutRouter.routes())
app.use(checkoutRouter.allowedMethods())

// Orders routers (private)
app.use(ordersRouter.routes())
app.use(ordersRouter.allowedMethods())

// Admin routes (private:admin)
app.use(adminRouter.routes())
app.use(adminRouter.allowedMethods())

// Not found middleware
app.use((ctx) => {
  ctx.response.status = 404
  ctx.response.body = 'Not found.'
})

console.log(`The server is starting up at port: ${PORT}`)
await app.listen({ port: +PORT })
