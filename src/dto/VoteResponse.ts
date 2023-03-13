import { Field, Int, ObjectType } from 'type-graphql'

@ObjectType()
export class VoteResponse {
  @Field(() => Int, { defaultValue: 0 })
  value: number

  @Field(() => Int, { nullable: true })
  updatedPoints: number | null
}
