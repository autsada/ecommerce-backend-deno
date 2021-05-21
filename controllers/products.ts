import { RouterMiddleware, helpers } from '../deps.ts'

import { runQuery } from '../db/db.ts'
import { fetchProducts, countProducts, fetchProductById } from '../db/query.ts'

export const listProducts: RouterMiddleware = async (ctx) => {
  try {
    const { l, q } = helpers.getQuery(ctx) as { l?: string; q?: string }

    // Count number of rows in the products table (total products)
    const countResult = await runQuery<{ count: bigint }>(countProducts())
    const countData = countResult.rows[0]
    const count = Number(countData.count)

    // limit --> number of rows to be queried in each query
    const limit = l ? +l : 3 // default to 40

    // skip --> number of rows to be skipped in each query
    const currentQuery = q ? +q : 1 // default to 1
    const skip = (currentQuery - 1) * limit
    // currentQuery = 1, limit = 3 --> skip = (1-1)*3 = 0 --> 1-3
    // currentQuery = 2, limit = 3 --> skip = (2-1)*3 = 3 --> 4-6

    const result = await runQuery(fetchProducts(limit, skip))
    const products = result.rows

    // Calculate number of times to query in order to get all items
    const totalQueries = Math.ceil(count / limit)

    // Calculate if there are more items to be queried
    const hasMore = currentQuery + 1 <= totalQueries

    ctx.response.body = { products, totalQueries, hasMore }
  } catch (error) {
    throw error
  }
}

export const listProduct: RouterMiddleware = async (ctx) => {
  try {
    const { productId } = ctx.params as { productId: string }

    const result = await runQuery(fetchProductById(productId))
    const product = result.rows[0]

    if (!product) {
      ctx.throw(404)
    }

    ctx.response.body = { product }
  } catch (error) {
    throw error
  }
}
