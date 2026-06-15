import { redis } from '@devvit/web/server';
import type { T5 } from '@devvit/web/shared';

export function parseStoredCount(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '0', 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

// Separate hashes keep post/comment counters independent and easy to inspect.
function postsCountKey(subredditId: T5): string {
  return `flairUpdater:posts:${subredditId}`;
}

function commentsCountKey(subredditId: T5): string {
  return `flairUpdater:comments:${subredditId}`;
}

export async function incrementPostCount(
  subredditId: T5,
  username: string
): Promise<void> {
  // Atomic increment for post counter.
  await redis.hIncrBy(postsCountKey(subredditId), username, 1);
}

export async function incrementCommentCount(
  subredditId: T5,
  username: string
): Promise<void> {
  // Atomic increment for comment counter.
  await redis.hIncrBy(commentsCountKey(subredditId), username, 1);
}

export async function getUserPostCount(
  subredditId: T5,
  username: string
): Promise<number> {
  // Return zero when user has no existing counter.
  const value = await redis.hGet(postsCountKey(subredditId), username);
  return parseStoredCount(value);
}

export async function getUserCommentCount(
  subredditId: T5,
  username: string
): Promise<number> {
  // Return zero when user has no existing counter.
  const value = await redis.hGet(commentsCountKey(subredditId), username);
  return parseStoredCount(value);
}
