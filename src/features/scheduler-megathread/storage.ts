import { redis } from '@devvit/web/server';
import type { T3, T5 } from '@devvit/web/shared';

// Redis key for "which UTC week already received an auto-created megathread".
function lastWeekKey(subredditId: T5): string {
  return `weeklyMegathread:lastCreatedWeek:${subredditId}`;
}

// Redis key for last created post id (mainly for debugging/traceability).
function lastPostIdKey(subredditId: T5): string {
  return `weeklyMegathread:lastPostId:${subredditId}`;
}

// Short-lived lock key used to prevent duplicate scheduler post creation.
function weekLockKey(subredditId: T5, week: string): string {
  return `weeklyMegathread:weekLock:${subredditId}:${week}`;
}

export async function getLastCreatedWeek(
  subredditId: T5
): Promise<string | undefined> {
  // Missing value means no weekly post has been created yet.
  return redis.get(lastWeekKey(subredditId));
}

export async function setLastCreatedWeek(
  subredditId: T5,
  week: string
): Promise<void> {
  // Persist current week marker after successful auto-post creation.
  await redis.set(lastWeekKey(subredditId), week);
}

export async function getLastCreatedPostId(
  subredditId: T5
): Promise<string | undefined> {
  // Optional trace value for support/debug scenarios.
  return redis.get(lastPostIdKey(subredditId));
}

export async function setLastCreatedPostId(
  subredditId: T5,
  postId: T3
): Promise<void> {
  // Save ID of latest created megathread.
  await redis.set(lastPostIdKey(subredditId), postId);
}

export async function acquireWeekCreationLock(
  subredditId: T5,
  week: string
): Promise<boolean> {
  // NX ensures only one scheduler run obtains the lock.
  // Short expiration avoids permanent lock if process crashes mid-run.
  const result = await redis.set(weekLockKey(subredditId, week), '1', {
    nx: true,
    expiration: new Date(Date.now() + 5 * 60 * 1000),
  });

  // Redis returns "OK" when lock acquisition succeeds.
  return result === 'OK';
}

export async function releaseWeekCreationLock(
  subredditId: T5,
  week: string
): Promise<void> {
  // Release lock so next run can retry after failure.
  await redis.del(weekLockKey(subredditId, week));
}
