import { redis } from '@devvit/web/server';

// Redis key for "which UTC week already received an auto-created megathread".
const lastWeekKey = (subredditId: string) =>
  `weeklyMegathread:lastCreatedWeek:${subredditId}`;
// Redis key for last created post id (mainly for debugging/traceability).
const lastPostIdKey = (subredditId: string) =>
  `weeklyMegathread:lastPostId:${subredditId}`;
// Short-lived lock key used to prevent duplicate scheduler post creation.
const weekLockKey = (subredditId: string, week: string) =>
  `weeklyMegathread:weekLock:${subredditId}:${week}`;

export async function getLastCreatedWeek(subredditId: string) {
  // Missing value means no weekly post has been created yet.
  return redis.get(lastWeekKey(subredditId));
}

export async function setLastCreatedWeek(subredditId: string, week: string) {
  // Persist current week marker after successful auto-post creation.
  await redis.set(lastWeekKey(subredditId), week);
}

export async function getLastCreatedPostId(subredditId: string) {
  // Optional trace value for support/debug scenarios.
  return redis.get(lastPostIdKey(subredditId));
}

export async function setLastCreatedPostId(
  subredditId: string,
  postId: string
) {
  // Save ID of latest created megathread.
  await redis.set(lastPostIdKey(subredditId), postId);
}

export async function acquireWeekCreationLock(
  subredditId: string,
  week: string
) {
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
  subredditId: string,
  week: string
) {
  // Release lock so next run can retry after failure.
  await redis.del(weekLockKey(subredditId, week));
}
