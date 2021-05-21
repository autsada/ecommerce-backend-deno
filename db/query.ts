import {
  User,
  CartItem,
  Address,
  Product,
  Order,
  OrderItem,
  Role,
} from '../types/types.ts'

export const fetchProducts = (limit?: number, skip?: number) =>
  `SELECT * FROM products ORDER BY created_at DESC LIMIT ${
    limit ? limit : 'NULL'
  } OFFSET ${skip ? skip : 'NULL'};`

export const countProducts = () => `SELECT COUNT(*) FROM products;`

export const fetchProductById = (id: string) =>
  `SELECT * FROM products WHERE id = '${id}';`

export const insertProduct = ({
  title,
  description,
  price,
  image_url,
  image_file_name,
  image_public_id,
  category,
  inventory,
  creator,
}: Omit<Product, 'id' | 'created_at' | 'updated_at'>) =>
  `INSERT INTO products(title, description, price, image_url, image_file_name, image_public_id, category, inventory, creator) VALUES('${title}', '${description}', ${price}, '${image_url}', '${image_file_name}', '${image_public_id}', '${category}', ${inventory}, '${creator}') RETURNING *;`

export const editProduct = (
  productId: string,
  {
    title,
    description,
    price,
    image_url,
    image_file_name,
    image_public_id,
    category,
    inventory,
  }: Pick<
    Product,
    | 'title'
    | 'description'
    | 'price'
    | 'image_url'
    | 'image_file_name'
    | 'image_public_id'
    | 'category'
    | 'inventory'
  >
) =>
  `UPDATE products SET title = '${title}', description = '${description}', price = ${price}, image_url = '${image_url}', image_file_name = '${image_file_name}', image_public_id = '${image_public_id}', category = '${category}', inventory = ${inventory} WHERE id = '${productId}' RETURNING *;`

export const removeProduct = (productId: string) =>
  `DELETE FROM products WHERE id = '${productId}';`

export const fetchUsers = (limit: number, skip: number) =>
  `SELECT id, username, email, role, stripe_id, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT ${
    limit ? limit : 'NULL'
  } OFFSET ${skip ? skip : 'NULL'};`

export const countUsers = () => `SELECT COUNT(*) FROM users;`

export const fetchUserById = (id: string) =>
  `SELECT * FROM users WHERE id = '${id}';`

export const fetchUserByEmail = (email: string) =>
  `SELECT * FROM users WHERE email = '${email}';`

export const fetchUserByToken = (token: string) =>
  `SELECT * FROM users WHERE reset_password_token = '${token}';`

export const insertUser = ({
  username,
  email,
  password,
}: Pick<User, 'username' | 'email' | 'password'>) =>
  `INSERT INTO users(username, email, password) VALUES('${username}', '${email}', '${password}') RETURNING *;`

export const editUserResetToken = ({
  id,
  reset_password_token,
  reset_password_token_expiry,
}: Pick<
  User,
  'id' | 'reset_password_token' | 'reset_password_token_expiry'
>) => {
  return `UPDATE users SET reset_password_token = '${reset_password_token}', reset_password_token_expiry = ${reset_password_token_expiry} WHERE id = '${id}' RETURNING *;`
}

export const editUserNewPassword = ({
  id,
  password,
}: Pick<User, 'id' | 'password'>) => {
  return `UPDATE users SET password = '${password}', reset_password_token = NULL, reset_password_token_expiry = NULL WHERE id = '${id}' RETURNING *;`
}

export const editUserStripeCustomer = (userId: string, stripeId: string) => {
  return `UPDATE users SET stripe_id = '${stripeId}' WHERE id = '${userId}' RETURNING *;`
}

export const editUserRole = (userId: string, role: Role) => {
  return `UPDATE users SET role = '${role}' WHERE id = '${userId}' RETURNING *;`
}

export const removeUser = (userId: string) =>
  `DELETE FROM users WHERE id = '${userId}';`

// export const fetchCartByUserId = (userId: string) =>
//   `SELECT
//     c.id, c.payment_intent, c.owner_id, c.created_at, c.updated_at,
//     json_build_object('id', a.id, 'fullname', a.fullname, 'address1', a.address1, 'address2', a.address2, 'city', a.city, 'zip_code', a.zip_code, 'phone', a.phone) as shipping_address,
//     json_agg(json_build_object('id', ct.id, 'quantity', ct.quantity, 'product_id', ct.product_id, 'created_at', ct.created_at, 'updated_at', ct.updated_at, 'title', p.title, 'description', p.description, 'price', p.price, 'image_url', p.image_url, 'category', p.category, 'inventory', p.inventory) ORDER BY ct.created_at DESC) as items
//     FROM carts c
//     LEFT JOIN addresses a ON (a.id = c.address_id)
//     LEFT JOIN cart_items ct ON (ct.cart_id = c.id)
//     LEFT JOIN products p ON (p.id = ct.product_id)
//     WHERE c.owner_id = '${userId}'
//     GROUP BY c.id, a.id;`

export const fetchCartByUserId = (userId: string) =>
  `SELECT
    c.id, c.payment_intent, c.owner_id, c.created_at, c.updated_at,
    CASE WHEN a.id IS NULL THEN NULL ELSE json_build_object('id', a.id, 'fullname', a.fullname, 'address1', a.address1, 'address2', a.address2, 'city', a.city, 'zip_code', a.zip_code, 'phone', a.phone) END as shipping_address,
    array_remove(array_agg(jsonb_build_object('id', ct.id, 'quantity', ct.quantity, 'product_id', ct.product_id, 'owner_id', ct.owner_id, 'created_at', ct.created_at, 'updated_at', ct.updated_at, 'title', p.title, 'description', p.description, 'price', p.price, 'image_url', p.image_url, 'image_file_name', p.image_file_name,'image_public_id', p.image_public_id, 'category', p.category, 'inventory', p.inventory) ORDER BY ct.created_at DESC),
    to_jsonb('{"id":null, "quantity":null, "product_id":null, "owner_id":null, "created_at":null, "updated_at":null, "title":null, "description":null, "price":null, "image_url":null, "image_file_name":null, "image_public_id":null, "category":null, "inventory":null}'::json)
    ) as items
    FROM carts c
    LEFT JOIN addresses a ON (a.id = c.address_id)
    LEFT JOIN cart_items ct ON (ct.cart_id = c.id)
    LEFT JOIN products p ON (p.id = ct.product_id)
    WHERE c.owner_id = '${userId}'
    GROUP BY c.id, a.id;`

export const fetchCartById = (cartId: string) =>
  `SELECT * FROM carts WHERE id = '${cartId}';`

export const fetchCartByOwnerId = (ownerId: string) =>
  `SELECT * FROM carts WHERE owner_id = '${ownerId}';`

export const insertCart = (userId: string) =>
  `INSERT INTO carts(owner_id) VALUES('${userId}') RETURNING *;`

export const removeCart = (cartId: string) =>
  `DELETE FROM carts WHERE id = '${cartId}';`

export const insertCartItem = ({
  quantity,
  product_id,
  cart_id,
  owner_id,
}: Pick<CartItem, 'cart_id' | 'quantity' | 'product_id' | 'owner_id'>) =>
  `INSERT INTO cart_items(quantity, product_id, cart_id, owner_id) VALUES(${quantity}, '${product_id}', '${cart_id}', '${owner_id}') RETURNING *;`

export const editCartItem = (quantity: number, cartItemId: string) =>
  `UPDATE cart_items SET quantity = ${quantity} WHERE id = '${cartItemId}' RETURNING *;`

export const removeCartItem = (cartItemId: string) =>
  `DELETE FROM cart_items WHERE id = '${cartItemId}';`

export const fetchShippingAddressesByUserId = (userId: string) =>
  `SELECT * FROM addresses WHERE owner_id = '${userId}' ORDER BY created_at DESC;`

export const fetchShippingAddressById = (addressId: string) =>
  `SELECT * FROM addresses WHERE id = '${addressId}';`

export const insertShippingAddress = ({
  fullname,
  address1,
  address2,
  city,
  zip_code,
  phone,
  owner_id,
}: Omit<Address, 'id' | 'created_at' | 'updated_at'>) =>
  `INSERT INTO addresses(fullname, address1, address2, city, zip_code, phone, owner_id) VALUES('${fullname}', '${address1}', '${
    address2 ? address2 : ''
  }', '${city}', '${zip_code}', '${phone}', '${owner_id}') RETURNING *;`

export const editShippingAddress = (
  addressId: string,
  {
    fullname,
    address1,
    address2,
    city,
    zip_code,
    phone,
  }: Omit<Address, 'id' | 'owner_id' | 'created_at' | 'updated_at'>
) =>
  `UPDATE addresses SET fullname = '${fullname}', address1 = '${address1}', address2 = '${
    address2 ? address2 : ''
  }', city = '${city}', zip_code = '${zip_code}', phone = '${phone}' WHERE id = '${addressId}' RETURNING *;`

export const removeShippingAddress = (addressId: string) =>
  `DELETE FROM addresses WHERE id = '${addressId}';`

export const saveShippingAddressToCart = (addressId: string, cartId: string) =>
  `UPDATE carts SET address_id = '${addressId}' WHERE id = '${cartId}' RETURNING *;`

export const savePaymentIntentToCart = (
  cartId: string,
  paymentIntentId: string
) =>
  `UPDATE carts SET payment_intent = '${paymentIntentId}' WHERE id = '${cartId}' RETURNING *;`

export const fetchAllOrders = () =>
  `SELECT o.*, json_agg(json_build_object('id', oit.id, 'quantity', oit.quantity, 'product_id', oit.product_id, 'title', oit.title, 'description', oit.description, 'price', oit.price, 'image_url', oit.image_url, 'category', oit.category) ORDER BY oit.created_at DESC) as items FROM orders o LEFT JOIN order_items oit ON (oit.order_id = o.id) GROUP BY o.id ORDER BY o.created_at DESC;`

export const fetchOrdersByUserId = (userId: string) =>
  `SELECT o.*, json_agg(json_build_object('id', oit.id, 'quantity', oit.quantity, 'product_id', oit.product_id, 'title', oit.title, 'description', oit.description, 'price', oit.price, 'image_url', oit.image_url, 'category', oit.category) ORDER BY oit.created_at DESC) as items FROM orders o LEFT JOIN order_items oit ON (oit.order_id = o.id) WHERE o.owner_id = '${userId}' GROUP BY o.id ORDER BY o.created_at DESC;`

export const fetchOrderById = (orderId: string) =>
  `SELECT o.*, json_agg(json_build_object('id', ot.id, 'quantity', ot.quantity, 'product_id', ot.product_id, 'title', ot.title, 'description', ot.description, 'price', ot.price, 'image_url', ot.image_url, 'category', ot.category) ORDER BY ot.created_at DESC) as items FROM orders o LEFT JOIN order_items ot ON (ot.order_id = o.id) WHERE o.id = '${orderId}' GROUP BY o.id;`

export const insertOrder = ({
  quantity,
  amount,
  payment,
  payment_status,
  shipping_address,
  owner_id,
}: Pick<
  Order,
  | 'quantity'
  | 'amount'
  | 'payment'
  | 'payment_status'
  | 'shipping_address'
  | 'owner_id'
>) =>
  `INSERT INTO orders(quantity, amount, payment, payment_status, shipping_address, owner_id) VALUES(${quantity}, ${amount}, '${payment}', '${payment_status}', '${shipping_address}', '${owner_id}') RETURNING *;`

export const insertOrderItem = ({
  quantity,
  product_id,
  title,
  description,
  price,
  image_url,
  category,
  owner_id,
  order_id,
}: Pick<
  OrderItem,
  | 'quantity'
  | 'product_id'
  | 'title'
  | 'description'
  | 'price'
  | 'image_url'
  | 'category'
  | 'owner_id'
  | 'order_id'
>) =>
  `INSERT INTO order_items(quantity, product_id, title, description, price, image_url, category, owner_id, order_id) VALUES(${quantity}, '${product_id}', '${title}', '${description}', ${price}, '${image_url}', '${category}', '${owner_id}', '${order_id}') RETURNING *;`

export const editOrderStatus = (orderId: string, status: string) =>
  `UPDATE orders SET shipment_status = '${status}' WHERE id = '${orderId}' RETURNING *;`

export const insertSession = (userId: string) =>
  `INSERT INTO sessions(owner_id) VALUES('${userId}') RETURNING *;`

export const fetchSessionById = (sessionId: string) =>
  `SELECT * FROM sessions WHERE id = '${sessionId}';`

export const removeSessionById = (sessionId: string) =>
  `DELETE FROM sessions WHERE id = '${sessionId}';`
