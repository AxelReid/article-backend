import { Post } from '../entities/Post'
import {
  Arg,
  Ctx,
  FieldResolver,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql'
import { CreatePostInput } from '../dto/CreatePostInput'
import { MyContext } from '../types'
import { isAuth } from '../middlewares/isAuth'
import { PaginatedPosts } from '../dto/PaginatedPosts'
import { UpDoot } from '../entities/UpDoot'
import { User } from '../entities/User'
import { VoteResponse } from '../dto/VoteResponse'
import { UpdatePostInput } from '../dto/UpdatePostInput'
import { LessThan } from 'typeorm'
import { AppDataSource } from '../orm.config'

@Resolver(Post)
export class PostResolver {
  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg('createPostInput') createPostInput: CreatePostInput,
    @Ctx() { req }: MyContext
  ) {
    return Post.create({
      ...createPostInput,
      creatorId: req.session.userId,
    }).save()
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg('id', () => Int) id: number,
    @Arg('updatePostInput') updatePostInput: UpdatePostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    const post = await this.post(id)
    if (post.creatorId !== req.session.userId)
      throw new Error("You can't update!")
    return await Post.save({ ...post, ...updatePostInput })
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(@Arg('id') id: number, @Ctx() { req }: MyContext) {
    const d = await Post.delete({ id, creatorId: req.session.userId })
    return !!d.affected
  }

  @Mutation(() => VoteResponse)
  @UseMiddleware(isAuth)
  async vote(
    @Arg('postId', () => Int) postId: number,
    @Arg('value', () => Int) value: number,
    @Ctx() { req }: MyContext
  ): Promise<VoteResponse> {
    const { userId } = req.session
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
    // return User.findOneBy({ id: root.creatorId })
  }

  @FieldResolver(() => Number)
  async updoots(@Root() root: Post, @Ctx() { req, loaders }: MyContext) {
    const userId = req.session.userId
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
  async postEdit(@Arg('id', () => Int) id: number, @Ctx() { req }: MyContext) {
    const creatorId = req.session.userId
    const post = await Post.findOne({
      where: {
        id,
        creatorId,
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
