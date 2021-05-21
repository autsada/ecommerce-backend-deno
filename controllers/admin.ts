import { RouterMiddleware, helpers } from '../deps.ts'

import { runQuery } from '../db/db.ts'
import {
  insertProduct,
  fetchProductById,
  editProduct,
  removeProduct,
  fetchAllOrders,
  fetchOrderById,
  editOrderStatus,
  fetchUsers,
  countUsers,
  fetchUserById,
  editUserRole,
  removeUser,
} from '../db/query.ts'
import {
  Product,
  ProductCategory,
  OrderDetail,
  ShipmentStatus,
  Role,
  User,
} from '../types/types.ts'
import { uploadImage, deleteImage } from '../utils/helpers.ts'

export const addProduct: RouterMiddleware = async (ctx) => {
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

    if (body.type !== 'form-data') {
      ctx.throw(400)
      return
    }

    const bodyData = await body.value.read({
      // outPath: './images',
      maxSize: 5000000, // 5 MB
    })

    const productImage = bodyData.files && bodyData.files[0]
    const productData = bodyData.fields

    // Check if the product image content is available
    if (!productImage?.content) {
      ctx.throw(400)
      return
    }

    // Validate the productData --> 5 key-value pairs / correct key names and correct values --> not empty with correct type
    const productDataArray = Object.entries(productData) // [[k, v], [k, v], ..., [k, v]]

    if (productDataArray.length !== 5) {
      ctx.throw(400)
      return
    }

    const isProductDataValid = !productDataArray
      .map(([k, v]) => {
        const validKey = [
          'title',
          'description',
          'price',
          'category',
          'inventory',
        ].includes(k)

        const validValue =
          !!v &&
          (k === 'price' || k === 'inventory'
            ? !isNaN(+v)
            : typeof v === 'string')

        return validKey && validValue
      })
      .includes(false) // [true, true, true, true, true] --> true --> valid

    if (!isProductDataValid) {
      ctx.throw(400)
      return
    }

    const validProductData = productData as Record<
      keyof Pick<
        Product,
        'title' | 'description' | 'price' | 'category' | 'inventory'
      >,
      string
    >

    // Upload the image to Cloudinary
    const result = await uploadImage(productImage)

    if (!result) {
      ctx.throw(500)
    }

    // Insert the new product into the products table
    const insertProductResult = await runQuery<Product>(
      insertProduct({
        title: validProductData.title,
        description: validProductData.description,
        price: +validProductData.price,
        category: validProductData.category as ProductCategory,
        inventory: +validProductData.inventory,
        image_url: result.secure_url,
        image_file_name: result.original_filename,
        image_public_id: result.public_id,
        creator: request.user.id,
      })
    )
    const newProduct = insertProductResult.rows[0]

    if (!newProduct) {
      ctx.throw(500)
    }

    response.body = { product: newProduct }
  } catch (error) {
    throw error
  }
}

export const updateProduct: RouterMiddleware = async (ctx) => {
  try {
    const { request, response, params } = ctx
    const { productId } = params as { productId: string }

    if (!request.user) {
      ctx.throw(401)
      return
    }

    // Check if the product exists in the database
    const fetchProductResult = await runQuery<Product>(
      fetchProductById(productId)
    )
    const product = fetchProductResult.rows[0]

    if (!product) {
      ctx.throw(404)
    }

    if (!request.hasBody) {
      ctx.throw(400)
    }

    const body = request.body()

    if (body.type !== 'form-data') {
      ctx.throw(400)
      return
    }

    const bodyData = await body.value.read({
      // outPath: './images',
      maxSize: 5000000, // 5 MB
    })

    const productImage = bodyData.files && bodyData.files[0]
    const productData = bodyData.fields

    // Validate the productData --> 5 key-value pairs / correct key names and correct values --> not empty with correct type
    const productDataArray = Object.entries(productData) // [[k, v], [k, v], ..., [k, v]]

    if (productDataArray.length !== 5) {
      ctx.throw(400)
      return
    }

    const isProductDataValid = !productDataArray
      .map(([k, v]) => {
        const validKey = [
          'title',
          'description',
          'price',
          'category',
          'inventory',
        ].includes(k)

        const validValue =
          !!v &&
          (k === 'price' || k === 'inventory'
            ? !isNaN(+v)
            : typeof v === 'string')

        return validKey && validValue
      })
      .includes(false) // [true, true, true, true, true] --> true --> valid

    if (!isProductDataValid) {
      ctx.throw(400)
      return
    }

    const validProductData = productData as Record<
      keyof Pick<
        Product,
        'title' | 'description' | 'price' | 'category' | 'inventory'
      >,
      string
    >

    // Check if the product image content is available
    if (!productImage?.content) {
      // No image case
      // Check if the product data has been changed
      const isProductDataChanged = productDataArray
        .map(([k, v]) => {
          const valueChanged =
            k === 'price' || k === 'inventory'
              ? +v !== product[k]
              : v !== product[k as 'title' | 'description' | 'category']

          return valueChanged
        }) // [false, false, false, false, false] --> false --> not changed
        .includes(true) // [true, false, false, false, false] --> true --> changed

      if (!isProductDataChanged) {
        ctx.throw(400)
        return
      }

      // Update the product in the database
      const updateProductResult = await runQuery<Product>(
        editProduct(productId, {
          title: validProductData.title,
          description: validProductData.description,
          price: +validProductData.price,
          category: validProductData.category as ProductCategory,
          inventory: +validProductData.inventory,
          image_url: product.image_url,
          image_file_name: product.image_file_name,
          image_public_id: product.image_public_id,
        })
      )
      const updatedProduct = updateProductResult.rows[0]

      if (!updatedProduct) {
        ctx.throw(500)
      }

      response.body = { product: updatedProduct }
    } else {
      // Product's image is provided
      // Upload the new image to Cloudinary
      const uploadImageResult = await uploadImage(productImage)

      if (!uploadImageResult) {
        ctx.throw(500)
      }

      // Update the product in the products table
      const updateProductResult = await runQuery<Product>(
        editProduct(productId, {
          title: validProductData.title,
          description: validProductData.description,
          price: +validProductData.price,
          category: validProductData.category as ProductCategory,
          inventory: +validProductData.inventory,
          image_url: uploadImageResult.secure_url,
          image_file_name: uploadImageResult.original_filename,
          image_public_id: uploadImageResult.public_id,
        })
      )
      const updatedProduct = updateProductResult.rows[0]

      if (!updatedProduct) {
        ctx.throw(500)
      }

      // Delete the old image from Cloudinary
      deleteImage(product.image_public_id)

      response.body = { product: updatedProduct }
    }
  } catch (error) {
    throw error
  }
}

export const deleteProduct: RouterMiddleware = async (ctx) => {
  try {
    const { request, response, params } = ctx
    const { productId } = params as { productId: string }

    if (!request.user) {
      ctx.throw(401)
      return
    }

    // Check if the product exists in the database
    const fetchProductResult = await runQuery<Product>(
      fetchProductById(productId)
    )
    const product = fetchProductResult.rows[0]

    if (!product) {
      ctx.throw(404)
    }

    // Delete the product from the database
    await runQuery(removeProduct(productId))

    // Delete the product's image from Cloudinary
    deleteImage(product.image_public_id)

    // Send the response
    response.body = {
      message: `The product: ${product.title} has been removed.`,
    }
  } catch (error) {
    throw error
  }
}

export const listOrders: RouterMiddleware = async (ctx) => {
  try {
    const { request, response } = ctx

    if (!request.user) {
      ctx.throw(401)
    }

    // Fetch all orders from the database
    const fetchOrdersResult = await runQuery<OrderDetail>(fetchAllOrders())
    const orders = fetchOrdersResult.rows

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
    }

    // Fetch all orders from the database
    const fetchOrderResult = await runQuery<OrderDetail>(
      fetchOrderById(orderId)
    )
    const order = fetchOrderResult.rows[0]

    if (!order) {
      ctx.throw(404)
    }

    response.body = { order }
  } catch (error) {
    throw error
  }
}

export const updateOrder: RouterMiddleware = async (ctx) => {
  try {
    const { request, response, params } = ctx
    const { orderId } = params as { orderId: string }

    if (!request.user) {
      ctx.throw(401)
    }

    if (!request.hasBody) {
      ctx.throw(400)
    }

    const body = request.body()

    if (body.type !== 'json') {
      ctx.throw(400)
    }

    const { shipmentStatus } = (await body.value) as { shipmentStatus: string }

    if (!shipmentStatus) {
      ctx.throw(400)
    }

    // Validate the shipment status
    const shipmentStatuses: ShipmentStatus[] = [
      'New',
      'Preparing',
      'Shipped',
      'Delivered',
      'Canceled',
    ]

    if (!shipmentStatuses.includes(shipmentStatus as ShipmentStatus)) {
      ctx.throw(400)
    }

    // Check if the order exists in the database
    const fetchOrderResult = await runQuery<OrderDetail>(
      fetchOrderById(orderId)
    )
    const order = fetchOrderResult.rows[0]

    if (!order) {
      ctx.throw(404)
    }

    // Check if the shipment status has been changed
    if (order.shipment_status === shipmentStatus) {
      ctx.throw(400)
    }

    // Update the order
    const updateOrderResult = await runQuery(
      editOrderStatus(orderId, shipmentStatus)
    )
    const updatedOrder = updateOrderResult.rows[0]

    if (!updatedOrder) {
      ctx.throw(500)
    }

    response.body = { order: updatedOrder }
  } catch (error) {
    throw error
  }
}

export const listUsers: RouterMiddleware = async (ctx) => {
  try {
    const { l, q } = helpers.getQuery(ctx) as { l?: string; q?: string }

    // Count number of rows in the users table (total users)
    const countResult = await runQuery<{ count: bigint }>(countUsers())
    const countData = countResult.rows[0]
    const count = Number(countData.count)

    // limit --> number of rows to be queried in each query
    const limit = l ? +l : 3 // default to 40

    // skip --> number of rows to be skipped in each query
    const currentQuery = q ? +q : 1 // default to 1
    const skip = (currentQuery - 1) * limit
    // currentQuery = 1, limit = 3 --> skip = (1-1)*3 = 0 --> 1-3
    // currentQuery = 2, limit = 3 --> skip = (2-1)*3 = 3 --> 4-6

    const result = await runQuery(fetchUsers(limit, skip))
    const users = result.rows

    // Calculate number of times to query in order to get all items
    const totalQueries = Math.ceil(count / limit)

    // Calculate if there are more items to be queried
    const hasMore = currentQuery + 1 <= totalQueries

    ctx.response.body = { users, totalQueries, hasMore }
  } catch (error) {
    throw error
  }
}

export const getUser: RouterMiddleware = async (ctx) => {
  try {
    const { request, response, params } = ctx
    const { userId } = params as { userId: string }

    if (!request.user) {
      ctx.throw(401)
    }

    const fetchUserResult = await runQuery(fetchUserById(userId))
    const user = fetchUserResult.rows[0]

    if (!user) {
      ctx.throw(404)
    }

    response.body = { user }
  } catch (error) {
    throw error
  }
}

export const updateUser: RouterMiddleware = async (ctx) => {
  try {
    const { request, response, params } = ctx
    const { userId } = params as { userId: string }

    if (!request.user) {
      ctx.throw(401)
      return
    }

    // Prevent the super admin user from updating their own role
    if (userId === request.user.id) {
      ctx.throw(400)
    }

    if (!request.hasBody) {
      ctx.throw(400)
    }

    const body = request.body()

    if (body.type !== 'json') {
      ctx.throw(400)
    }

    const { role } = await body.value

    if (!role) {
      ctx.throw(400)
    }

    // Validate the role
    const roles: Role[] = ['CLIENT', 'ADMIN', 'SUPER_ADMIN']
    if (!roles.includes(role)) {
      ctx.throw(400)
    }

    // Check if the user exists in the database
    const fetchUserResult = await runQuery<User>(fetchUserById(userId))
    const user = fetchUserResult.rows[0]

    if (!user) {
      ctx.throw(404)
    }

    // Check if the user's role has been changed
    if (user.role === role) {
      ctx.throw(400)
    }

    // Update the user in the database
    const updateUserResult = await runQuery(editUserRole(userId, role))
    const updatedUser = updateUserResult.rows[0]

    if (!updatedUser) {
      ctx.throw(500)
    }

    response.body = { user: updatedUser }
  } catch (error) {
    throw error
  }
}

export const deleteUser: RouterMiddleware = async (ctx) => {
  try {
    const { request, response, params } = ctx
    const { userId } = params as { userId: string }

    if (!request.user) {
      ctx.throw(401)
    }

    // Check if the user exists in the database
    const fetchUserResult = await runQuery<User>(fetchUserById(userId))
    const user = fetchUserResult.rows[0]

    if (!user) {
      ctx.throw(404)
    }

    // Remove the user
    await runQuery(removeUser(userId))

    response.body = {
      message: `The user: ${user.username} has been removed from the database.`,
    }
  } catch (error) {
    throw error
  }
}
