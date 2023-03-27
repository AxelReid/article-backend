import { createParamDecorator } from 'type-graphql'
import jwt from 'jsonwebtoken'

export function ExtractUserId(): ParameterDecorator {
  return createParamDecorator(({ context }) => {
    const req = (context as { req: any })?.req
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return null
    }

    const token = authHeader.split(' ')[1] // Get the token from "Bearer <JWT_token>"

    if (!token || token === '') {
      return null
    }

    let decodedToken
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
      return null
    }

    if (!decodedToken) {
      return null
    }

    return (decodedToken as { userId: number })?.userId // Assuming the token payload contains a "userId" field
  })
}
