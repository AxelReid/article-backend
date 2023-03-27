import { Field, ObjectType } from 'type-graphql'
import { User } from '../entities/User'

@ObjectType()
class FieldError {
  @Field()
  field: string

  @Field()
  message: string
}

@ObjectType()
export class LoginResponse {
  @Field(() => [FieldError] || String, { nullable: true })
  errors?: FieldError[] | String

  @Field(() => User, { nullable: true })
  user?: User

  @Field(() => String, { nullable: true })
  token?: string
}
