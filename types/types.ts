import '../deps.ts'

declare module '../deps.ts' {
  interface Request {
    sessionId?: string
    user?: User
  }
}

export type ProductCategory = 'Clothing' | 'Shoes' | 'Watches' | 'Accessories'
export type Role = 'CLIENT' | 'ADMIN' | 'SUPER_ADMIN'
export type ShipmentStatus =
  | 'New'
  | 'Preparing'
  | 'Shipped'
  | 'Delivered'
  | 'Canceled'

// Type products table
export type Product = {
  id: string
  title: string
  description: string
  price: number
  image_url: string
  image_file_name: string
  image_public_id: string
  category: ProductCategory
  inventory: number
  creator: string
  created_at: string
  updated_at: string
}

// Type addresses table
export type Address = {
  id: string
  fullname: string
  address1: string
  address2?: string
  city: string
  zip_code: string
  phone: string
  owner_id: string
  created_at: string
  updated_at: string
}

// Type users table
export type User = {
  id: string
  username: string
  email: string
  password: string
  role: Role
  reset_password_token?: string
  reset_password_token_expiry?: number
  stripe_id?: string
  created_at: string
  updated_at: string
}

// Type carts table
export type Cart = {
  id: string
  payment_intent?: string
  owner_id: string
  address_id?: string
  created_at: string
  updated_at: string
}

// Type cart_items table
export type CartItem = {
  id: string
  quantity: number
  product_id: string
  cart_id: string
  owner_id: string
  created_at: string
  updated_at: string
}

// Type orders table
export type Order = {
  id: string
  quantity: number
  amount: number
  payment: string
  payment_status: string
  shipment_status: ShipmentStatus
  shipping_address: string
  owner_id: string
  created_at: string
  updated_at?: string
}

// Type order_items table
export type OrderItem = {
  id: string
  quantity: number
  product_id: string
  title: string
  description: string
  price: number
  image_url: string
  category: ProductCategory
  owner_id: string
  order_id: string
  created_at: string
  updated_at: string
}

// Type for cart_items joined with products
export type CartItemDetail = Pick<
  CartItem,
  'id' | 'quantity' | 'product_id' | 'owner_id' | 'created_at' | 'updated_at'
> &
  Pick<
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

// Type for carts joined with addresses and cart_items (which joined with products)
export type CartDetail = Omit<Cart, 'address_id'> & {
  shipping_address: Address | null
  items: CartItemDetail[]
}

// Type for orders joined with order_items
export type OrderDetail = Omit<Order, 'shipping_address'> & {
  shipping_address: Address
} & {
  items: OrderItem[]
}
