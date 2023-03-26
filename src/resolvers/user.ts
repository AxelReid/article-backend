import { User } from '../entities/User'
import { MyContext } from '../types'
import {
  Arg,
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
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from '../constants'
import { UserLoginInput } from '../dto/UserLoginInput'
import { registerValidation } from '../utils/registerValidation'
import { sendEmail } from '../utils/sendEmail'
import { v4 } from 'uuid'

@Resolver(User)
export class UserResolver {
  @Mutation(() => LoginResponse)
  async register(
    @Arg('userRegisterInput') userRegisterInput: UserRegisterInput,
    @Ctx() { req }: MyContext
  ): Promise<LoginResponse> {
    try {
      const errors = registerValidation(userRegisterInput)
      if (errors) return { errors }

      const hashPass = await argon2.hash(userRegisterInput.password)
      userRegisterInput.password = hashPass
      const user = await User.create({ ...userRegisterInput }).save()
      req.session.userId = user.id
      return { user }
    } catch (error) {
      const uniqueErr = error.message.includes('UNIQUE')

      if (uniqueErr) {
        const nameErr = error.message.includes('user.username')
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
    @Arg('userLoginInput') { usernameOrEmail, password }: UserLoginInput,
    @Ctx() { req }: MyContext
  ): Promise<LoginResponse> {
    const user = await User.findOne({
      where: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
    })

    if (!user)
      return {
        errors: [
          { field: 'usernameOrEmail', message: "The user doesn't exist" },
        ],
      }
    const valid = await argon2.verify(user.password, password)
    if (!valid)
      return {
        errors: [{ field: 'password', message: 'The password is incorrect' }],
      }

    req.session.userId = user.id

    return { user }
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) => {
      req.session.destroy((err) => {
        if (err) resolve(false)
        else {
          res.clearCookie(COOKIE_NAME)
          resolve(true)
        }
      })
    })
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
    @Ctx() { redis, req }: MyContext
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

      req.session.userId = user.id

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

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    const userId = req.session.userId
    if (!userId) return null
    return User.findOneBy({ id: userId })
  }

  @Query(() => [User])
  users() {
    return User.find()
  }

  @FieldResolver(() => String)
  email(@Root() root: User, @Ctx() { req }: MyContext) {
    if (req.session.userId === root.id) return root.email
    return 'hidden'
  }
}
