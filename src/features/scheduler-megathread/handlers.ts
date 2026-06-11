import { context, reddit } from '@devvit/web/server';
import { getWeeklyMegathreadSettings } from './settings';
import {
  acquireWeekCreationLock,
  getLastCreatedWeek,
  releaseWeekCreationLock,
  setLastCreatedPostId,
  setLastCreatedWeek,
} from './storage';

// Mapping from setting string values to JavaScript UTC weekday indexes.
const DAY_TO_UTC_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const getIsoWeekKey = (date: Date) => {
  // Convert to UTC midnight date to avoid local timezone drift.
  const utcDate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  // ISO week algorithm: shift to nearest Thursday.
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );

  // Example format: 2026-W18
  return `${utcDate.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

const createMegathreadPost = async (
  megathreadSettings: Awaited<ReturnType<typeof getWeeklyMegathreadSettings>>
) => {
  // Resolve current subreddit context where app is installed.
  const subreddit = await reddit.getCurrentSubreddit();
  // Submit post as app account to keep automation behavior predictable.
  const post = await reddit.submitPost({
    subredditName: subreddit.name,
    title: megathreadSettings.title,
    text: megathreadSettings.body,
    runAs: 'APP',
  });

  return post.id;
};

export async function runWeeklyMegathreadDaily() {
  // Read fresh settings each scheduler run.
  const megathreadSettings = await getWeeklyMegathreadSettings();
  if (!megathreadSettings.enabled) {
    return { created: false, reason: 'feature-disabled' };
  }

  // Only create on the configured weekday in UTC.
  const now = new Date();
  const scheduledDay = DAY_TO_UTC_INDEX[megathreadSettings.dayUtc];
  if (now.getUTCDay() !== scheduledDay) {
    return { created: false, reason: 'day-mismatch' };
  }

  // Idempotency: one auto-created megathread per ISO week.
  const weekKey = getIsoWeekKey(now);
  const lastCreatedWeek = await getLastCreatedWeek(context.subredditId);
  if (lastCreatedWeek === weekKey) {
    return { created: false, reason: 'already-created-this-week' };
  }

  // Prevent duplicate scheduled posts when jobs overlap/retry at the same time.
  const lockAcquired = await acquireWeekCreationLock(
    context.subredditId,
    weekKey
  );
  if (!lockAcquired) {
    return { created: false, reason: 'creation-lock-not-acquired' };
  }

  try {
    // Create and persist markers on success.
    const postId = await createMegathreadPost(megathreadSettings);
    await setLastCreatedWeek(context.subredditId, weekKey);
    await setLastCreatedPostId(context.subredditId, postId);

    return { created: true, postId };
  } catch (error) {
    // Unlock on failure so the next scheduler tick can retry.
    await releaseWeekCreationLock(context.subredditId, weekKey);
    throw error;
  }
}

export async function createWeeklyMegathreadManual() {
  // Manual menu action still respects feature toggle.
  const megathreadSettings = await getWeeklyMegathreadSettings();
  if (!megathreadSettings.enabled) {
    return {
      success: false,
      message: 'Weekly megathread feature is disabled in install settings.',
    };
  }

  // Explicit permission check keeps endpoint safe even if menu exposure changes.
  const currentUser = await reddit.getCurrentUser();
  const subreddit = await reddit.getCurrentSubreddit();
  if (!currentUser) {
    return {
      success: false,
      message: 'Unable to identify current user.',
    };
  }

  const modPermissions = await currentUser.getModPermissionsForSubreddit(
    subreddit.name
  );
  const canManagePosts =
    modPermissions.includes('all') || modPermissions.includes('posts');
  if (!canManagePosts) {
    return {
      success: false,
      message: 'You need mod post permissions to create a weekly megathread.',
    };
  }

  // Manual path intentionally bypasses weekly idempotency for testing/override.
  const postId = await createMegathreadPost(megathreadSettings);
  return {
    success: true,
    message: `Weekly megathread created successfully (${postId}).`,
  };
}
