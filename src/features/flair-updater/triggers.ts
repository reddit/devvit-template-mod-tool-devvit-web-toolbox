import { context, reddit } from '@devvit/web/server';
import type {
  OnCommentSubmitRequest,
  OnPostSubmitRequest,
} from '@devvit/web/shared';
import { isFlairUpdaterEnabled } from './settings';
import {
  getUserCommentCount,
  getUserPostCount,
  incrementCommentCount,
  incrementPostCount,
} from './storage';

const updateUserFlair = async (username: string) => {
  // Re-read both counters after increment so flair always reflects the latest
  // values even when users alternate between posts and comments.
  const [postCount, commentCount, subreddit] = await Promise.all([
    getUserPostCount(context.subredditId, username),
    getUserCommentCount(context.subredditId, username),
    reddit.getCurrentSubreddit(),
  ]);

  await reddit.setUserFlair({
    subredditName: subreddit.name,
    username,
    // Educational template format: explicit post/comment split.
    text: `posts: ${postCount} | comments: ${commentCount}`,
  });
};

export async function handlePostSubmitFlairUpdater(
  input: OnPostSubmitRequest
): Promise<void> {
  // Feature can be toggled at install settings level.
  if (!(await isFlairUpdaterEnabled())) return;

  // Ignore events with missing/deleted author.
  const username = input.author?.name;
  if (!username || username === '[deleted]') return;

  // Increment post counter first, then write final flair snapshot.
  await incrementPostCount(context.subredditId, username);
  await updateUserFlair(username);
}

export async function handleCommentSubmitFlairUpdater(
  input: OnCommentSubmitRequest
): Promise<void> {
  // Feature can be toggled at install settings level.
  if (!(await isFlairUpdaterEnabled())) return;

  // Ignore events with missing/deleted author.
  const username = input.author?.name;
  if (!username || username === '[deleted]') return;

  // Increment comment counter first, then write final flair snapshot.
  await incrementCommentCount(context.subredditId, username);
  await updateUserFlair(username);
}
