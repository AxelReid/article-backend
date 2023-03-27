// authChecker.ts
import { AuthChecker } from 'type-graphql'
import { verify } from 'jsonwebtoken'
import { MyContext } from '../types'

export const authChecker: AuthChecker<MyContext> = ({ context }) => {
  const authHeader = context.req.headers.authorization

  if (authHeader) {
    const token = authHeader.split(' ')[1]

    try {
      const payload = verify(token, process.env.JWT_SECRET as string)
      context.userId = (payload as { userId?: number })?.userId
      return true
    } catch (err) {
      console.error('Invalid JWT:', err)
    }
  }

  return false
}
