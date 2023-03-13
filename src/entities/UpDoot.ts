import { Field, Int, ObjectType } from 'type-graphql'
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm'
import { Post } from './Post'
import { User } from './User'

// user <--> posts
// user --> join table(updoot) <-- post

@ObjectType()
@Entity()
export class UpDoot extends BaseEntity {
  @Field(() => Int, { defaultValue: 0 })
  @Column({ type: 'int' })
  value: number

  @PrimaryColumn()
  userId: number

  @PrimaryColumn()
  postId: number

  @ManyToOne(() => User, (user) => user.updoots)
  user: User

  @ManyToOne(() => Post, (post) => post.updoots, { onDelete: 'CASCADE' })
  post: Post
}
