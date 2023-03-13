import { Request, Response } from 'express'
import type { Redis } from 'ioredis'
import { createUpdootLoader } from './loader/createUpdootLoader'
import { createUserLoader } from './loader/createUserLoader'

export type MyContext = {
  req: Request
  res: Response
  redis: Redis
  loaders: {
    userLoader: typeof createUserLoader
    updootLoader: typeof createUpdootLoader
  }
}
