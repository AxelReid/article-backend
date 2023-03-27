import { Post } from '../entities/Post'
import {
  Arg,
  Authorized,
  Ctx,
  FieldResolver,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
} from 'type-graphql'
import { CreatePostInput } from '../dto/CreatePostInput'
import { MyContext } from '../types'
import { PaginatedPosts } from '../dto/PaginatedPosts'
import { UpDoot } from '../entities/UpDoot'
import { User } from '../entities/User'
import { VoteResponse } from '../dto/VoteResponse'
import { UpdatePostInput } from '../dto/UpdatePostInput'
import { LessThan } from 'typeorm'
import { AppDataSource } from '../orm.config'
import { ExtractUserId } from '../decorators/extractUserId'

@Resolver(Post)
export class PostResolver {
  @Authorized()
  @Mutation(() => Post)
  async createPost(
    @Arg('createPostInput') createPostInput: CreatePostInput,
    @Ctx() { userId }: MyContext
  ) {
    return Post.create({
      ...createPostInput,
      creatorId: userId,
    }).save()
  }

  @Authorized()
  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg('id', () => Int) id: number,
    @Arg('updatePostInput') updatePostInput: UpdatePostInput,
    @Ctx() { userId }: MyContext
  ): Promise<Post | null> {
    const post = await this.post(id)
    if (post.creatorId !== userId) throw new Error("You can't update!")
    return await Post.save({ ...post, ...updatePostInput })
  }

  @Authorized()
  @Mutation(() => Boolean)
  async deletePost(@Arg('id') id: number, @Ctx() { userId }: MyContext) {
    const d = await Post.delete({ id, creatorId: userId })
    return !!d.affected
  }

  @Authorized()
  @Mutation(() => VoteResponse)
  async vote(
    @Arg('postId', () => Int) postId: number,
    @Arg('value', () => Int) value: number,
    @Ctx() { userId }: MyContext
  ): Promise<VoteResponse> {
    const realValue = value > 0 ? 1 : -1
    const vote = await UpDoot.findOneBy({ userId, postId })

    const point =
      // giving new point

      !vote
        ? realValue
        : // removing the point
        vote.value === realValue
        ? -realValue
        : // changing the point
          realValue * 2

    const response: VoteResponse = {
      value: 0,
      updatedPoints: null,
    }

    await AppDataSource.transaction(async (tm) => {
      // user voted before
      if (vote) {
        if (vote.value === realValue) {
          await tm.delete(UpDoot, { userId, postId })
        } else {
          await tm.update(UpDoot, { userId, postId }, { value: realValue })
          response.value = realValue
        }
      }
      // voting new
      else {
        await tm.insert(UpDoot, { userId, postId, value: realValue })
        response.value = realValue
      }

      const res = await tm
        .getRepository(Post)
        .createQueryBuilder('post')
        .update(Post)
        .where(`id = ${postId}`)
        .set({ points: () => `points + ${point}` })
        .returning(['points'])
        .execute()
      // .increment({ id: postId }, 'points', point)
      response.updatedPoints = res.raw[0].points
    })
    return response
  }

  @FieldResolver(() => String)
  textShort(@Root() root: Post) {
    return root.text.slice(0, 50).trim() + (root.text.length > 50 ? ' ...' : '')
  }

  @FieldResolver(() => User)
  creator(@Root() root: Post, @Ctx() { loaders }: MyContext) {
    return loaders.userLoader.load(root.creatorId)
  }

  @FieldResolver(() => Number)
  async updoots(
    @Root() root: Post,
    @Ctx() { loaders }: MyContext,
    @ExtractUserId() userId: number | null
  ) {
    if (!userId) return { value: 0 }

    const updoots = await loaders.updootLoader.load({ postId: root.id, userId })
    return {
      value: updoots.value,
    }
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit)
    const realLimitPlusOne = realLimit + 1

    const posts = await Post.find({
      order: { createdAt: 'desc' },
      take: realLimitPlusOne,
      where: {
        ...(cursor ? { createdAt: LessThan(new Date(cursor)) } : {}),
      },
    })

    return {
      posts: posts?.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    }
  }

  @Query(() => Post, { nullable: true })
  async post(@Arg('id', () => Int) id: number) {
    const post = await Post.findOneBy({ id })
    if (post) return post
    throw new Error('Post not found!')
  }

  @Query(() => Post, { nullable: true })
  async postEdit(
    @Arg('id', () => Int) id: number,
    @ExtractUserId() userId: number
  ) {
    const post = await Post.findOne({
      where: {
        id,
        creatorId: userId,
      },
      select: {
        id: true,
        title: true,
        text: true,
      },
    })
    if (post) return post
    throw new Error("You don't have a that post")
  }
}
