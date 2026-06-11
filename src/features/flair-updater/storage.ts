import { redis } from '@devvit/web/server';

// Separate hashes keep post/comment counters independent and easy to inspect.
const postsCountKey = (subredditId: string) =>
  `flairUpdater:posts:${subredditId}`;
const commentsCountKey = (subredditId: string) =>
  `flairUpdater:comments:${subredditId}`;

export async function incrementPostCount(
  subredditId: string,
  username: string
) {
  // Atomic increment for post counter.
  await redis.hIncrBy(postsCountKey(subredditId), username, 1);
}

export async function incrementCommentCount(
  subredditId: string,
  username: string
) {
  // Atomic increment for comment counter.
  await redis.hIncrBy(commentsCountKey(subredditId), username, 1);
}

export async function getUserPostCount(subredditId: string, username: string) {
  // Return zero when user has no existing counter.
  const value = await redis.hGet(postsCountKey(subredditId), username);
  // Parse as integer and harden against malformed values.
  const parsed = Number.parseInt(value ?? '0', 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getUserCommentCount(
  subredditId: string,
  username: string
) {
  // Return zero when user has no existing counter.
  const value = await redis.hGet(commentsCountKey(subredditId), username);
  // Parse as integer and harden against malformed values.
  const parsed = Number.parseInt(value ?? '0', 10);
  return Number.isFinite(parsed) ? parsed : 0;
}
