import { RouterMiddleware } from '../deps.ts'

import { runQuery } from '../db/db.ts'
import {
  fetchCartByUserId,
  fetchProductById,
  insertCart,
  insertCartItem,
  editCartItem,
  removeCartItem,
} from '../db/query.ts'
import { CartDetail, Product, Cart, CartItem } from '../types/types.ts'

export const listUserCart: RouterMiddleware = async (ctx) => {
  try {
    const { request, response } = ctx

    if (!request.user) {
      ctx.throw(401)
      return
    }

    // Fetch user' cart
    const result = await runQuery<CartDetail>(
      fetchCartByUserId(request.user.id)
    )
    const cart = result.rows[0]

    response.body = { cart: cart ? cart : null }
  } catch (error) {
    throw error
  }
}

export const addToCart: RouterMiddleware = async (ctx) => {
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

    // Get values from the body
    const { quantity, productId } = (await body.value) as {
      quantity: number
      productId: string
    }

    if (!quantity || !productId) {
      ctx.throw(400)
    }

    if (typeof quantity !== 'number') {
      ctx.throw(400)
    }

    if (quantity < 0) {
      ctx.throw(400)
    }

    // Fetch the product from the database
    const fetchProductResult = await runQuery<Product>(
      fetchProductById(productId)
    )
    const product = fetchProductResult.rows[0]

    if (!product) {
      ctx.throw(400)
    }

    // Check if the product's inventory is enough
    if (product.inventory < quantity) {
      ctx.throw(400, 'Not enough inventory')
    }

    // Fetch user's cart from the database
    const result = await runQuery<CartDetail>(
      fetchCartByUserId(request.user.id)
    )
    const cartDetail = result.rows[0]

    if (!cartDetail) {
      // Create a new cart
      const insertCartResult = await runQuery<Cart>(insertCart(request.user.id))
      const newCart = insertCartResult.rows[0]

      if (!newCart) {
        ctx.throw(500)
      }

      // Create a new cart item
      const insertCartItemResult = await runQuery<CartItem>(
        insertCartItem({
          quantity,
          cart_id: newCart.id,
          owner_id: request.user.id,
          product_id: productId,
        })
      )
      const newCartItem = insertCartItemResult.rows[0]

      if (!newCartItem) {
        ctx.throw(500)
      }

      response.body = { cartItem: newCartItem }
    } else {
      // Update the user's cart
      // Check if the added product is already in the cart
      const cartItem = cartDetail.items.find(
        (item) => item.product_id === productId
      )

      if (cartItem) {
        // the added product is arealdy in the cart --> update the cart item quantity
        const updatedQuantity = cartItem.quantity + quantity

        // Check if the updated quantity is greater than the product's inventory
        if (updatedQuantity > product.inventory) {
          ctx.throw(400, 'Not enough inventory')
        }

        // Update the cart item quantity
        const updateCartItemResult = await runQuery<CartItem>(
          editCartItem(updatedQuantity, cartItem.id)
        )
        const updatedCartItem = updateCartItemResult.rows[0]

        if (!updatedCartItem) {
          ctx.throw(500)
        }

        response.body = { cartItem: updatedCartItem }
      } else {
        // Create a new cart item
        const insertCartItemResult = await runQuery<CartItem>(
          insertCartItem({
            quantity,
            cart_id: cartDetail.id,
            owner_id: request.user.id,
            product_id: productId,
          })
        )
        const newCartItem = insertCartItemResult.rows[0]

        if (!newCartItem) {
          ctx.throw(500)
        }

        response.body = { cartItem: newCartItem }
      }
    }
  } catch (error) {
    throw error
  }
}

export const updateCart: RouterMiddleware = async (ctx) => {
  try {
    const { request, response, params } = ctx
    const { cartItemId } = params as { cartItemId: string }

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

    // Get values from the body
    const { quantity } = (await body.value) as {
      quantity: number
    }

    if (!quantity) {
      ctx.throw(400)
    }

    if (typeof quantity !== 'number') {
      ctx.throw(400)
    }

    // Fetch user's cart from the database
    const result = await runQuery<CartDetail>(
      fetchCartByUserId(request.user.id)
    )
    const cartDetail = result.rows[0]

    if (!cartDetail) {
      ctx.throw(400)
    }

    // Check if the cartId is in the cart
    const cartItemDetail = cartDetail.items.find(
      (item) => item.id === cartItemId
    )

    if (!cartItemDetail) {
      ctx.throw(400)
      return
    }

    // Calculate the updated quantity
    const updatedQuantity = cartItemDetail.quantity + quantity

    if (updatedQuantity < 0) {
      ctx.throw(400)
    }

    if (updatedQuantity === 0) {
      // Delete the cart item
      await runQuery(removeCartItem(cartItemId))

      response.body = {
        message: `The product: ${cartItemDetail.title} has been removed from your cart.`,
      }
    } else {
      // Update the cart item
      const updateCartItemResult = await runQuery<CartItem>(
        editCartItem(updatedQuantity, cartItemId)
      )
      const updatedCartItem = updateCartItemResult.rows[0]

      if (!updatedCartItem) {
        ctx.throw(500)
      }

      response.body = { cartItem: updatedCartItem }
    }
  } catch (error) {
    throw error
  }
}

export const deleteCartItem: RouterMiddleware = async (ctx) => {
  try {
    const { request, response, params } = ctx
    const { cartItemId } = params as { cartItemId: string }

    if (!request.user) {
      ctx.throw(401)
      return
    }

    // Fetch user' cart from the database
    const fetchCartResult = await runQuery<CartDetail>(
      fetchCartByUserId(request.user.id)
    )
    const cartDetail = fetchCartResult.rows[0]

    if (!cartDetail) {
      ctx.throw(400)
    }

    // Check if the cart item to be deleted is in the cart
    const cartItemDetail = cartDetail.items.find(
      (item) => item.id === cartItemId
    )

    if (!cartItemDetail) {
      ctx.throw(400)
      return
    }

    // Delete the cart item
    await runQuery(removeCartItem(cartItemId))

    response.body = {
      message: `The product: ${cartItemDetail.title} has been removed from your cart.`,
    }
  } catch (error) {
    throw error
  }
}
