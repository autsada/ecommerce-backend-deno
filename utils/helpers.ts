import { FormDataFile, createHash } from '../deps.ts'

import { CartItemDetail } from '../types/types.ts'

// const {
//     SENDGRID_API_KEY,
//     CLOUDINARY_API_KEY,
//     CLOUDINARY_API_SECRET,
//     CLOUDINARY_BASE_URL,
// } = config()

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')!
const CLOUDINARY_API_KEY = Deno.env.get('CLOUDINARY_API_KEY')!
const CLOUDINARY_API_SECRET = Deno.env.get('CLOUDINARY_API_SECRET')!
const CLOUDINARY_BASE_URL = Deno.env.get('CLOUDINARY_BASE_URL')!

export const validateEmail = (email: string) => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

    return emailRegex.test(email)
}

export const sendEmail = async (
    toEmail: string,
    toName: string,
    subject: string,
    html: string,
    fromEmail: string = 'noreply@ecomshop.com'
) => {
    const message = {
        personalizations: [
            {
                to: [{ email: toEmail, name: toName }],
                subject: subject,
            },
        ],
        content: [{ type: 'text/html', value: html }],
        from: { email: fromEmail, name: 'EcomShop' },
        reply_to: { email: 'tim@test.com', name: 'Tim' },
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    })

    return response
}

export const uploadImage = async (image: FormDataFile) => {
    try {
        if (!image.content) return null

        // Create a raw signature
        const timestamp = Math.round(Date.now() / 1000)
        const upload_preset = 'ecommerce'
        const rawSignature = `timestamp=${timestamp}&upload_preset=${upload_preset}${CLOUDINARY_API_SECRET}`

        // Hash the raw signature
        const hasher = createHash('sha1')
        hasher.update(rawSignature)
        const signature = hasher.toString()

        // Convert the image's content (Uint8Array) --> Blob
        const imageBuffer = uint8ToBuffer(image.content)
        const imageBlob = bufferToBlob(imageBuffer)

        // Create a formData
        const formData = new FormData()

        formData.append('file', imageBlob, image.originalName)
        formData.append('api_key', CLOUDINARY_API_KEY)
        formData.append('timestamp', `${timestamp}`)
        formData.append('upload_preset', upload_preset)
        formData.append('signature', signature)

        // Send a request to Cloudinary
        const response = await fetch(`${CLOUDINARY_BASE_URL}/upload`, {
            method: 'POST',
            body: formData,
        })

        if (response.status !== 200) return null

        return response.json()
    } catch (error) {
        return null
    }
}

export const uint8ToBuffer = (array: Uint8Array): ArrayBuffer => {
    return array.buffer.slice(
        array.byteOffset,
        array.byteLength + array.byteOffset
    )
}

export const bufferToBlob = (buffer: ArrayBuffer) => {
    return new Blob([buffer])
}

export const deleteImage = async (public_id: string) => {
    try {
        // Create a raw signature
        const timestamp = Math.round(Date.now() / 1000)
        const rawSignature = `public_id=${public_id}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`

        // Hash the raw signature
        const hasher = createHash('sha1')
        hasher.update(rawSignature)
        const signature = hasher.toString()

        // Create a formData
        const formData = new FormData()

        formData.append('public_id', public_id)
        formData.append('api_key', CLOUDINARY_API_KEY)
        formData.append('timestamp', `${timestamp}`)
        formData.append('signature', signature)

        // Send a request to Cloudinary
        const response = await fetch(`${CLOUDINARY_BASE_URL}/destroy`, {
            method: 'POST',
            body: formData,
        })

        if (response.status !== 200) return null

        return response.json()
    } catch (error) {
        return null
    }
}

export const calculateCartAmount = (cartItems: CartItemDetail[]) =>
    cartItems.reduce((total, item) => item.quantity * item.price + total, 0)

export const calculateCartQuantity = (cartItems: CartItemDetail[]) =>
    cartItems.reduce((total, item) => item.quantity + total, 0)
