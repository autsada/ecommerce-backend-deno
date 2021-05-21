import { RouterMiddleware } from '../deps.ts'

import { runQuery } from '../db/db.ts'
import {
  fetchCartByUserId,
  editProduct,
  insertOrder,
  insertOrderItem,
  removeCart,
  fetchOrdersByUserId,
} from '../db/query.ts'
import { CartDetail, Order, OrderDetail } from '../types/types.ts'
import { calculateCartAmount, calculateCartQuantity } from '../utils/helpers.ts'

export const createOrder: RouterMiddleware = async (ctx) => {
  try {
    const { request, response } = ctx

    if (!request.user) {
      ctx.throw(401)
      return
    }

    if (!request.hasBody) {
      ctx.throw(400)
    }

    const body = request.body()

    if (body.type !== 'json') {
      ctx.throw(400)
    }

    const { paymentId, paymentStatus } = (await body.value) as {
      paymentId: string
      paymentStatus: string
    }

    if (!paymentId || !paymentStatus) {
      ctx.throw(400)
    }

    // Fetch user's cart detail from the database
    const fetchCartDetailResult = await runQuery<CartDetail>(
      fetchCartByUserId(request.user.id)
    )
    const cartDetail = fetchCartDetailResult.rows[0]

    if (!cartDetail) {
      ctx.throw(400)
    }

    // Update the inventory of each product in the cart
    cartDetail.items.forEach((item) => {
      runQuery(
        editProduct(item.product_id, {
          title: item.title,
          description: item.description,
          price: item.price,
          image_url: item.image_url,
          image_file_name: item.image_file_name,
          image_public_id: item.image_public_id,
          category: item.category,
          inventory:
            item.inventory - item.quantity >= 0
              ? item.inventory - item.quantity
              : 0,
        })
      )
    })

    // Create a new order (convert the cart to order)
    const insertOrderResult = await runQuery<Order>(
      insertOrder({
        quantity: calculateCartQuantity(cartDetail.items),
        amount: calculateCartAmount(cartDetail.items),
        payment: paymentId,
        payment_status: paymentStatus,
        shipping_address: JSON.stringify(cartDetail.shipping_address || {}),
        owner_id: cartDetail.owner_id,
      })
    )
    const newOrder = insertOrderResult.rows[0]

    if (!newOrder) {
      ctx.throw(500)
    }

    // Create new order items (convert the cart items to order items)
    const orderItems = await Promise.all(
      cartDetail.items.map(async (item) => {
        const insertOrderItemResult = await runQuery(
          insertOrderItem({
            quantity: item.quantity,
            product_id: item.product_id,
            title: item.title,
            description: item.description,
            price: item.price,
            image_url: item.image_url,
            category: item.category,
            owner_id: item.owner_id,
            order_id: newOrder.id,
          })
        )
        const orderItem = insertOrderItemResult.rows[0]

        return orderItem
      })
    ) // [Promise, Promise]

    // Deletet the cart --> the cart items will be automatically deleted
    await runQuery(removeCart(cartDetail.id))

    response.body = {
      order: newOrder,
      items: orderItems,
    }
  } catch (error) {
    throw error
  }
}

export const listUserOrders: RouterMiddleware = async (ctx) => {
  try {
    const { request, response } = ctx

    if (!request.user) {
      ctx.throw(401)
      return
    }

    const fetchUserOrdersResult = await runQuery<OrderDetail>(
      fetchOrdersByUserId(request.user.id)
    )
    const orders = fetchUserOrdersResult.rows

    response.body = { orders }
  } catch (error) {
    throw error
  }
}

export const getOrder: RouterMiddleware = async (ctx) => {
  try {
    const { request, response, params } = ctx
    const { orderId } = params as { orderId: string }

    if (!request.user) {
      ctx.throw(401)
      return
    }

    const fetchUserOrdersResult = await runQuery<OrderDetail>(
      fetchOrdersByUserId(request.user.id)
    )
    const orders = fetchUserOrdersResult.rows
    const order = orders.find((item) => item.id === orderId)

    if (!order) {
      ctx.throw(404)
    }

    response.body = { order }
  } catch (error) {
    throw error
  }
}
