import { Field, ObjectType } from 'type-graphql'
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Post } from './Post'
import { UpDoot } from './UpDoot'

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id: number

  @Field()
  @Column({ unique: true })
  email: string

  @Field()
  @Column({ unique: true })
  username: string

  @Column()
  password: string

  @OneToMany(() => Post, (post) => post.creatorId)
  posts: Post[]

  @OneToMany(() => UpDoot, (updoot) => updoot.user)
  updoots: UpDoot[]

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date
}
