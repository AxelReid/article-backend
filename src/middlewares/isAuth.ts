import { MiddlewareFn } from 'type-graphql'
import { MyContext } from '../types'

export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
  if (context.req.session.userId) return next()
  throw new Error('Unauthorized!')
}
