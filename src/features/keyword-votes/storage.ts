import { redis } from '@devvit/web/server';

// Per-post hash that stores keyword -> vote count.
const keyForCounts = (postId: string) => `keywordVotes:counts:${postId}`;
// Per-post string key that stores the sticky tally comment ID.
const keyForTallyComment = (postId: string) =>
  `keywordVotes:tallyComment:${postId}`;

export async function ensurePostKeywords(postId: string, keywords: string[]) {
  const countsKey = keyForCounts(postId);
  // Read the current hash so we only initialize missing fields.
  const current = await redis.hGetAll(countsKey);
  const missing: Record<string, string> = {};

  for (const keyword of keywords) {
    // Initialize unseen keywords to zero to keep render logic predictable.
    if (current[keyword] === undefined) {
      missing[keyword] = '0';
    }
  }

  // Write only when there is missing data to avoid unnecessary redis ops.
  if (Object.keys(missing).length > 0) {
    await redis.hSet(countsKey, missing);
  }
}

export async function incrementKeywordVote(postId: string, keyword: string) {
  const countsKey = keyForCounts(postId);
  // Atomic increment for a single keyword bucket.
  await redis.hIncrBy(countsKey, keyword, 1);
}

export async function getKeywordCounts(postId: string, keywords: string[]) {
  // Read all buckets and then project only configured keywords.
  const countValues = await redis.hGetAll(keyForCounts(postId));
  const counts: Record<string, number> = {};

  for (const keyword of keywords) {
    // Parse integer count safely; malformed values fall back to zero.
    const value = Number.parseInt(countValues[keyword] ?? '0', 10);
    counts[keyword] = Number.isFinite(value) ? value : 0;
  }

  return counts;
}

export async function setTallyCommentId(postId: string, commentId: string) {
  // Persist comment id so updates can edit instead of posting duplicates.
  await redis.set(keyForTallyComment(postId), commentId);
}

export async function getTallyCommentId(postId: string) {
  // Missing key means no tally comment has been created yet.
  return redis.get(keyForTallyComment(postId));
}
