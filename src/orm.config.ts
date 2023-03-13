import 'dotenv-safe/config'
import { join } from 'path'
import { DataSource } from 'typeorm'
import { __prod__ } from './constants'
import { Post } from './entities/Post'
import { UpDoot } from './entities/UpDoot'
import { User } from './entities/User'

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DATABASE_URL,
  // host:'localhost',
  // port:5432,
  // username:'postgres',
  // password:'postgres',
  // url: process.env.DATABASE_URL,
  // synchronize: !__prod__,
  logging: !__prod__,
  entities: [User, Post, UpDoot],
  migrations: [join(__dirname, './migrations/*')], // uncomment in prod
})
