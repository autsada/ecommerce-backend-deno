import { RouterMiddleware } from '../deps.ts'

import { runQuery } from '../db/db.ts'
import {
  fetchShippingAddressesByUserId,
  insertShippingAddress,
  fetchShippingAddressById,
  editShippingAddress,
  removeShippingAddress,
} from '../db/query.ts'
import { Address } from '../types/types.ts'

export const listUserAddresses: RouterMiddleware = async (ctx) => {
  try {
    const { request, response } = ctx

    if (!request.user) {
      ctx.throw(401)
      return
    }

    // Fetch user's addresses from the database
    const fetchAddressesResult = await runQuery<Address>(
      fetchShippingAddressesByUserId(request.user.id)
    )
    const addresses = fetchAddressesResult.rows

    response.body = { shipping_addresses: addresses }
  } catch (error) {
    throw error
  }
}

export const getAddress: RouterMiddleware = async (ctx) => {
  try {
    const { request, response, params } = ctx
    const { addressId } = params as { addressId: string }

    if (!request.user) {
      ctx.throw(401)
      return
    }

    // Fetch user's addresses from the database
    const fetchAddressesResult = await runQuery<Address>(
      fetchShippingAddressesByUserId(request.user.id)
    )
    const addresses = fetchAddressesResult.rows

    // Find the address by id
    const address = addresses.find((item) => item.id === addressId)

    if (!address) {
      ctx.throw(404)
    }

    response.body = { shipping_address: address }
  } catch (error) {
    throw error
  }
}

export const addAddress: RouterMiddleware = async (ctx) => {
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

    const addressData = (await body.value) as Pick<
      Address,
      'fullname' | 'address1' | 'address2' | 'city' | 'zip_code' | 'phone'
    >

    if (
      !addressData.fullname ||
      !addressData.address1 ||
      !addressData.city ||
      !addressData.zip_code ||
      !addressData.phone
    ) {
      ctx.throw(400)
    }

    // Insert a new address into the addresses table
    const insertAddressResult = await runQuery<Address>(
      insertShippingAddress({
        ...addressData,
        owner_id: request.user.id,
      })
    )
    const newAddress = insertAddressResult.rows[0]

    if (!newAddress) {
      ctx.throw(500)
    }

    response.body = { shipping_address: newAddress }
  } catch (error) {
    throw error
  }
}

export const updateAddress: RouterMiddleware = async (ctx) => {
  try {
    const { request, response, params } = ctx
    const { addressId } = params as { addressId: string }

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

    const addressData = (await body.value) as Pick<
      Address,
      'fullname' | 'address1' | 'address2' | 'city' | 'zip_code' | 'phone'
    >

    if (
      !addressData.fullname ||
      !addressData.address1 ||
      !addressData.city ||
      !addressData.zip_code ||
      !addressData.phone
    ) {
      ctx.throw(400)
    }

    // Fetch the address from the database using the address id
    const fetchAddressResult = await runQuery<Address>(
      fetchShippingAddressById(addressId)
    )
    const address = fetchAddressResult.rows[0]

    if (!address) {
      ctx.throw(400)
    }

    // Check the ownership of the address
    if (address.owner_id !== request.user.id) {
      ctx.throw(401)
    }

    // Check if the address has been changed
    if (
      address.fullname === addressData.fullname &&
      address.address1 === addressData.address1 &&
      address.city === addressData.city &&
      address.zip_code === addressData.zip_code &&
      address.phone === addressData.phone &&
      (!address.address2
        ? !addressData.address2
        : address.address2 === addressData.address2)
    ) {
      ctx.throw(400, 'Nothing changed')
    }

    // Update the address in the addresses table
    const updateAddressResult = await runQuery<Address>(
      editShippingAddress(addressId, addressData)
    )
    const updatedAddres = updateAddressResult.rows[0]

    if (!updatedAddres) {
      ctx.throw(500)
    }

    response.body = { shipping_address: updatedAddres }
  } catch (error) {
    throw error
  }
}

export const deleteAddress: RouterMiddleware = async (ctx) => {
  try {
    const { request, response, params } = ctx
    const { addressId } = params as { addressId: string }

    if (!request.user) {
      ctx.throw(401)
      return
    }

    // Fetch the address from the database
    const fetchAddressResult = await runQuery<Address>(
      fetchShippingAddressById(addressId)
    )
    const address = fetchAddressResult.rows[0]

    if (!address) {
      ctx.throw(404)
    }

    // Check the ownership of the address
    if (address.owner_id !== request.user.id) {
      ctx.throw(401)
    }

    // Delete the address
    await runQuery(removeShippingAddress(addressId))

    response.body = {
      message: `The shipping address ID: ${address.id} has been removed.`,
    }
  } catch (error) {
    throw error
  }
}
