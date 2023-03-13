import DataLoader from 'dataloader'
import { UpDoot } from '../entities/UpDoot'

export const createUpdootLoader = new DataLoader<
  { userId: number; postId: number },
  UpDoot
>(async (keys) => {
  const currentUserVotes = await UpDoot.findBy(keys as any)

  const voteIdsToVote: Record<string, UpDoot> = {}
  currentUserVotes.forEach((u) => {
    voteIdsToVote[`${u.userId}|${u.postId}`] = u
  })

  return keys.map((k) => {
    const vote = voteIdsToVote[`${k.userId}|${k.postId}`]
    return {
      postId: vote?.postId || k.postId,
      value: vote?.value || 0,
    }
  }) as UpDoot[]

  // return {
  //   value: value === null ? 0 : value,
  //   currentUserVote: currentUserVote === null ? 0 : currentUserVote,
  //   // total: 10, // COUNT(updoot.value) total
  //   // sum: 7, // SUM(updoot.value) sum
  //   // status: 0, // select value from updoot where userId = userId and postId = post.id
  // }
})
