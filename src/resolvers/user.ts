import { User } from '../entities/User'
import { MyContext } from '../types'
import {
  Arg,
  Authorized,
  Ctx,
  FieldResolver,
  Mutation,
  Query,
  Resolver,
  Root,
} from 'type-graphql'
import { UserRegisterInput } from '../dto/UserRegisterInput'
import argon2 from 'argon2'
import { LoginResponse } from '../dto/LoginResponse'
import { FORGOT_PASSWORD_PREFIX } from '../constants'
import { UserLoginInput } from '../dto/UserLoginInput'
import { registerValidation } from '../utils/registerValidation'
import { sendEmail } from '../utils/sendEmail'
import { v4 } from 'uuid'
import signJwtToken from '../utils/signJwtToken'
import { ExtractUserId } from '../decorators/extractUserId'

@Resolver(User)
export class UserResolver {
  @Mutation(() => LoginResponse)
  async register(
    @Arg('userRegisterInput') userRegisterInput: UserRegisterInput
  ): Promise<LoginResponse> {
    try {
      const errors = registerValidation(userRegisterInput)
      if (errors) return { errors }

      const hashPass = await argon2.hash(userRegisterInput.password)
      userRegisterInput.password = hashPass
      const user = await User.create({ ...userRegisterInput }).save()
      const token = signJwtToken(user.id)

      return { user, token }
    } catch (error) {
      const uniqueErr = error.message.includes('duplicate key')

      if (uniqueErr) {
        const nameErr = error?.detail?.includes('username')
        return {
          errors: [
            {
              field: nameErr ? 'username' : 'email',
              message: nameErr
                ? 'Username is taken!'
                : 'Email already registered!',
            },
          ],
        }
      }
      throw new Error('Something went wrong. Try again!')
    }
  }

  @Mutation(() => LoginResponse)
  async login(
    @Arg('userLoginInput') { usernameOrEmail, password }: UserLoginInput
  ): Promise<LoginResponse> {
    const user = await User.findOne({
      where: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
    })

    const errMsg = "Can't login!"
    if (!user) throw new Error(errMsg)
    const valid = await argon2.verify(user.password, password)
    if (!valid) throw new Error(errMsg)

    const token = signJwtToken(user.id)

    return { user, token }
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() { redis }: MyContext
  ) {
    const token = v4()
    const key = FORGOT_PASSWORD_PREFIX + token
    try {
      const user = await User.findOneBy({ email })
      if (!user) return true

      await redis.set(
        key,
        user.id,
        'EX',
        1000 * 60 * 60 * 24 // 1 day
        //1sec 1min 1hr  1day
      )

      await sendEmail(
        email,
        `<a href="http://localhost:3000/change-password/${token}">Reset password</a>`
      )
      return true
    } catch (error) {
      await redis.del(key)
      return false
    }
  }

  @Mutation(() => LoginResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { redis }: MyContext
  ): Promise<LoginResponse> {
    if (newPassword.length <= 3)
      return {
        errors: [
          {
            field: 'newPassword',
            message: 'length must be grater than 3',
          },
        ],
      }

    try {
      const key = FORGOT_PASSWORD_PREFIX + token
      const userId = await redis.get(key)
      if (!userId) throw new Error('Token expired!')

      const user = await User.findOneBy({ id: parseInt(userId) })
      if (!user) throw new Error("Can't change password!")

      await User.update(
        { id: parseInt(userId) },
        { password: await argon2.hash(newPassword) }
      )
      await redis.del(key)
      return { user }
    } catch (error) {
      throw new Error(error.message)
    }
  }

  @Authorized()
  @Query(() => User, { nullable: true })
  me(@Ctx() { userId }: MyContext) {
    if (!userId) return null
    return User.findOneBy({ id: userId })
  }

  @Query(() => [User])
  users() {
    return User.find()
  }

  @FieldResolver(() => String)
  email(@Root() root: User, @ExtractUserId() userId: number | null) {
    if (userId === root.id) return root.email
    return 'hidden'
  }
}
