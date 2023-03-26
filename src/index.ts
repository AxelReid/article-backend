import 'reflect-metadata'
import { AppDataSource } from './orm.config'
import express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'
import { PostResolver } from './resolvers/post'
import { UserResolver } from './resolvers/user'
import { __prod__ } from './constants'
import { MyContext } from './types'
import { redisSession } from './redis'
import cors from 'cors'
import { createUserLoader } from './loader/createUserLoader'
import { createUpdootLoader } from './loader/createUpdootLoader'
// import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core'

const main = async () => {
  await AppDataSource.initialize().catch((err) =>
    console.log('TypeOrm init failed: ', err)
  )
  // await AppDataSource.runMigrations()

  const app = express()

  const { redis, session } = redisSession()
  app.set('trust proxy', 1)
  app.use(session)

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({
      req,
      res,
      redis,
      loaders: {
        userLoader: createUserLoader,
        updootLoader: createUpdootLoader,
      },
    }),
    cache: 'bounded',
    // plugins: [ApolloServerPluginLandingPageGraphQLPlayground],
  })
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(','),
      credentials: true,
    })
  )

  await apolloServer.start()
  apolloServer.applyMiddleware({ app, cors: false })

  const port = parseInt(process.env.PORT)
  app.listen(port, () => console.log('Server started on localhost:' + port))
}
main().catch((err) => console.error(err))
