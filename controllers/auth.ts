import { RouterMiddleware, bcrypt, v4 } from '../deps.ts'

import { runQuery } from '../db/db.ts'
import {
  fetchUserByEmail,
  insertUser,
  insertSession,
  editUserResetToken,
  fetchUserByToken,
  editUserNewPassword,
} from '../db/query.ts'
import { User } from '../types/types.ts'
import {
  createAccessToken,
  createRefreshToken,
  setRefreshToken,
} from '../utils/tokens.ts'
import { validateEmail, sendEmail } from '../utils/helpers.ts'

export const signup: RouterMiddleware = async (ctx) => {
  try {
    const { request, response, cookies } = ctx

    // Check if the request has the body
    const hasBody = request.hasBody

    if (!hasBody) {
      ctx.throw(400, 'Please provide all required information.')
    }

    const body = request.body()

    // Check if the body has the content-type set to json
    if (body.type !== 'json') {
      ctx.throw(400)
    }

    const { username, email, password } = (await body.value) as {
      username: string
      email: string
      password: string
    }

    // Check if one of these values is empty
    if (!username || !email || !password) {
      ctx.throw(400)
    }

    // Validate the username
    const formatedUsername = username.trim()

    if (formatedUsername.length < 3) {
      ctx.throw(400, 'Username must be at least 3 characters.')
    }

    // Validate the email
    const formatedEmail = email.trim().toLowerCase()

    if (!validateEmail(formatedEmail)) {
      ctx.throw(400, 'Email is invalid.')
    }

    // Validate the password
    if (password.length < 6) {
      ctx.throw(400, 'Password must be at least 6 characters.')
    }

    // Check if the email already exists in the database
    const fetchUserResult = await runQuery<User>(
      fetchUserByEmail(formatedEmail)
    )
    const user = fetchUserResult.rows[0]

    if (user) {
      ctx.throw(400, 'The email is already in use.')
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password)

    // Save new user in the database
    const insertUserResult = await runQuery<User>(
      insertUser({
        username: formatedUsername,
        email: formatedEmail,
        password: hashedPassword,
      })
    )

    const newUser = insertUserResult.rows[0]

    if (!newUser) {
      ctx.throw(500)
    }

    // Authenticate the user
    // Create a new session in the sessions table
    const insertSessionResult = await runQuery<{
      id: string
      owner_id: string
    }>(insertSession(newUser.id))
    const session = insertSessionResult.rows[0]

    if (!session) {
      ctx.throw(500)
    }

    // Issue a refresh token: long-lived (7 days)
    const refreshToken = await createRefreshToken(session.id)

    // Set the refresh token in cookies
    setRefreshToken(refreshToken, cookies)

    // Issue an access token: short-lived (5 mins)
    const accessToken = await createAccessToken(session.id, newUser.id)

    // Send the response to the requestor (including the access token in the body)
    response.body = {
      message: 'You have successfully signed up',
      accessToken,
      user: newUser,
    }
  } catch (error) {
    throw error
  }
}

export const signin: RouterMiddleware = async (ctx) => {
  try {
    const { request, response, cookies } = ctx

    // Check if the request has the body
    const hasBody = request.hasBody

    if (!hasBody) {
      ctx.throw(400, 'Please provide all required information.')
    }

    const body = request.body()

    // Check if the body has the content-type set to json
    if (body.type !== 'json') {
      ctx.throw(400)
    }

    const { email, password } = (await body.value) as {
      email: string
      password: string
    }

    if (!email || !password) {
      ctx.throw(400, 'Please provide all required information.')
    }

    // Fomat the email
    const formatedEmail = email.trim().toLowerCase()

    // Check if the email already exists in the database
    const fetchUserResult = await runQuery<User>(
      fetchUserByEmail(formatedEmail)
    )
    const user = fetchUserResult.rows[0]

    if (!user) {
      ctx.throw(400, 'User not found, please sign up instead.')
    }

    // Check if the found user has reset password token --> if yes, inform the user to confirm the new password
    if (user.reset_password_token) {
      ctx.throw(400, 'Please reset your password.')
    }

    // Comparet the given pain password to the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      ctx.throw(400, 'Email or password is invalid.')
    }

    // Authenticate the user
    // Create a new session in the sessions table
    const insertSessionResult = await runQuery<{
      id: string
      owner_id: string
    }>(insertSession(user.id))
    const session = insertSessionResult.rows[0]

    if (!session) {
      ctx.throw(500)
    }

    // Issue a refresh token: long-lived (7 days)
    const refreshToken = await createRefreshToken(session.id)

    // Set the refresh token in cookies
    setRefreshToken(refreshToken, cookies)

    // Issue an access token: short-lived (5 mins)
    const accessToken = await createAccessToken(session.id, user.id)

    // Send the response to the requestor (including the access token in the body)
    response.body = { message: 'You are logged in', accessToken, user }
  } catch (error) {
    throw error
  }
}

export const resetPassword: RouterMiddleware = async (ctx) => {
  try {
    const { request, response } = ctx

    // Check if the request has the body
    const hasBody = request.hasBody

    if (!hasBody) {
      ctx.throw(400, 'Please provide all required information.')
    }

    const body = request.body()

    // Check if the body has the content-type set to json
    if (body.type !== 'json') {
      ctx.throw(400)
    }

    const { email } = (await body.value) as {
      email: string
    }

    if (!email) {
      ctx.throw(400, 'Please provide all required information.')
    }

    // Fomat the email
    const formatedEmail = email.trim().toLowerCase()

    // Check if the email exists in the database
    const fetchUserResult = await runQuery<User>(
      fetchUserByEmail(formatedEmail)
    )
    const user = fetchUserResult.rows[0]

    if (!user) {
      ctx.throw(400, 'User not found, please sign up instead.')
    }

    // Create a reset password token and its expiration time
    const resetPasswordToken = v4.generate()
    const expiration = Date.now() + 1000 * 60 * 30 // 30 mins from now

    // Save the token and expiration to the user in the database
    const updateUserResult = await runQuery(
      editUserResetToken({
        id: user.id,
        reset_password_token: resetPasswordToken,
        reset_password_token_expiry: expiration,
      })
    )
    const updatedUser = updateUserResult.rows[0]

    if (!updatedUser) {
      ctx.throw(500)
    }

    // Send a confirmation email to the user
    const subject = 'Reset your password'
    const html = `
    <div style={{width: '60%'}}>
      <p>Please click the link below to reset your password.</p> \n\n
      <a href='http://localhost:5000/?resetToken=${resetPasswordToken}' target='blank' style={{color: 'blue'}}>Click to reset password</a>
    </div>
`

    const sendEmailResult = await sendEmail(email, user.username, subject, html)

    if (sendEmailResult.status !== 202) {
      ctx.throw(500)
      return
    }

    // Send the response to the requestor (including the access token in the body)
    response.body = {
      message: 'Please check your email to confirm your reset password.',
    }
  } catch (error) {
    throw error
  }
}

export const confirmResetPassword: RouterMiddleware = async (ctx) => {
  try {
    const { request, response } = ctx

    // Check if the request has the body
    const hasBody = request.hasBody

    if (!hasBody) {
      ctx.throw(400, 'Please provide all required information.')
    }

    const body = request.body()

    // Check if the body has the content-type set to json
    if (body.type !== 'json') {
      ctx.throw(400)
    }

    const { password, resetPasswordToken } = (await body.value) as {
      password: string
      resetPasswordToken: string
    }

    if (!password || !resetPasswordToken) {
      ctx.throw(400, 'Please provide all required information.')
    }

    if (password.length < 6) {
      ctx.throw(400, 'Password must be at least 6 characters.')
    }

    // Query user from the database using reset password token
    const fetchUserResult = await runQuery<User>(
      fetchUserByToken(resetPasswordToken)
    )
    const user = fetchUserResult.rows[0]

    if (!user) {
      ctx.throw(400)
      return
    }

    // Check if the reset password token is not expired
    const isTokenValid =
      user.reset_password_token_expiry &&
      user.reset_password_token_expiry > Date.now()

    if (!isTokenValid) {
      ctx.throw(400)
      return
    }

    // Check if the new password doesn't equal the old password
    const isPasswordNotChanged = await bcrypt.compare(password, user.password)

    if (isPasswordNotChanged) {
      ctx.throw(400, 'Using the old password password is not allowed.')
      return
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password)

    // Update the user in the database
    const updateUserResult = await runQuery<User>(
      editUserNewPassword({ id: user.id, password: hashedPassword })
    )
    const updatedUser = updateUserResult.rows[0]

    if (!updatedUser) {
      ctx.throw(500)
      return
    }

    // Send the response to the requestor
    response.body = {
      message: 'You have successfully reset your password.',
    }
  } catch (error) {
    throw error
  }
}
