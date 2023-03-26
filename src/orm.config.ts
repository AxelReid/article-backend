import 'dotenv-safe/config'
import { join } from 'path'
import { DataSource, DataSourceOptions } from 'typeorm'
import { __prod__ } from './constants'
// import { Post } from './entities/Post'
// import { UpDoot } from './entities/UpDoot'
// import { User } from './entities/User'

// export const AppDataSource = new DataSource({
//   type: 'postgres',
//   url: process.env.DATABASE_URL,
//   // host: 'db',
//   // port: 5432,
//   // username: 'postgres',
//   // password: 'postgres',
//   // database: 'mydb',
//   logging: true,
//   synchronize: !__prod__, // good for development
//   entities: [join(__dirname, './entities/**/*.js')],
//   migrations: [join(__dirname, './migrations/*')], // better for prod
// })
const ormConfig: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  logging: true,
  synchronize: true, //!__prod__,
  entities: [join(__dirname, './entities/**/*.js')],
  migrations: [join(__dirname, './migrations/*')],
}
export default ormConfig
export const AppDataSource = new DataSource(ormConfig)
