import connectRedis from 'connect-redis'
import session from 'express-session'
import { COOKIE_NAME, __prod__ } from './constants'
import Redis from 'ioredis'

declare module 'express-session' {
  export interface SessionData {
    userId?: number
  }
}

export const redisSession = () => {
  const RedisStore = connectRedis(session)
  const redis = new Redis(process.env.REDIS_URL)

  return {
    redis,
    session: session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
        // disableTTL: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 1, // 1 days
        httpOnly: true,
        sameSite: 'lax', // csrf
        secure: __prod__, // cookie works on https
        // domain: __prod__ ? '.domain.com' : undefined,
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET,
      resave: false,
    }),
  }
}
