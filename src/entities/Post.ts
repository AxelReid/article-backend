import { Field, Int, ObjectType } from 'type-graphql'
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { UpDoot } from './UpDoot'
import { User } from './User'

@ObjectType()
@Entity()
export class Post extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id: number

  @Field()
  @Column()
  title: string

  @Field()
  @Column()
  text: string

  @Field()
  @Column()
  creatorId: number

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.posts)
  creator: User

  @Field(() => UpDoot)
  @OneToMany(() => UpDoot, (updoot) => updoot.post)
  updoots: UpDoot[]

  @Field(() => Int)
  @Column({ type: 'int', default: 0 })
  points: number

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date

  @Field(() => String)
  @UpdateDateColumn({ type: 'date' })
  updatedAt: Date
}
