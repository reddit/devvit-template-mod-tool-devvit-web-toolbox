import { reddit } from '@devvit/web/server';
import type {
  OnCommentSubmitRequest,
  OnPostSubmitRequest,
  T1,
  T3,
} from '@devvit/web/shared';
import { getBannedWordsSettings } from './settings.js';
import { findMatchedBannedWord } from './matching.js';

// Devvit payload IDs may arrive with or without fullnames.
// These helpers normalize to the typed IDs required by reddit.get*ById methods.
function asT1(id: string): T1 {
  return (id.startsWith('t1_') ? id : `t1_${id}`) as T1;
}

function asT3(id: string): T3 {
  return (id.startsWith('t3_') ? id : `t3_${id}`) as T3;
}

async function isSubredditModerator(
  authorName: string | undefined,
  subredditName: string | undefined
): Promise<boolean> {
  if (!authorName || authorName === '[deleted]' || !subredditName) return false;

  const user = await reddit.getUserByUsername(authorName);
  if (!user) return false;

  const modPermissions =
    await user.getModPermissionsForSubreddit(subredditName);
  return modPermissions.length > 0;
}

async function sendRemovalModmail(
  subredditName: string | undefined,
  authorName: string | undefined,
  contentType: 'comment' | 'post',
  matchedWord: string
): Promise<void> {
  // Modmail needs a real user recipient, so skip missing or deleted authors.
  if (!subredditName || !authorName || authorName === '[deleted]') return;

  // Create a user-facing modmail conversation that explains removal cause.
  await reddit.modMail.createConversation({
    subredditName,
    subject: `Your ${contentType} was removed in r/${subredditName}`,
    body: `Your ${contentType} was removed because it contains a banned word or phrase: "${matchedWord}".`,
    to: `u/${authorName}`,
    isAuthorHidden: true,
  });
}

export async function handleCommentSubmitBannedWords(
  input: OnCommentSubmitRequest
): Promise<void> {
  // Read current subreddit settings every run so behavior updates immediately.
  const { enabled, words } = await getBannedWordsSettings();
  // Fast exit when disabled or empty list.
  if (!enabled || words.length === 0) return;

  if (await isSubredditModerator(input.author?.name, input.subreddit?.name)) {
    return;
  }

  // Pull relevant event fields.
  const commentBody = input.comment?.body;
  const commentId = input.comment?.id;
  if (!commentBody || !commentId) return;

  // Match against configured banned words/phrases.
  const matchedWord = findMatchedBannedWord(commentBody, words);
  if (!matchedWord) return;

  // Fetch and remove the comment only when needed.
  const comment = await reddit.getCommentById(asT1(commentId));
  if (!comment.removed) {
    await comment.remove();
  }

  // Notify the user with a concrete reason.
  await sendRemovalModmail(
    input.subreddit?.name,
    input.author?.name,
    'comment',
    matchedWord
  );
}

export async function handlePostSubmitBannedWords(
  input: OnPostSubmitRequest
): Promise<void> {
  // Read settings for this subreddit installation.
  const { enabled, words } = await getBannedWordsSettings();
  if (!enabled || words.length === 0) return;

  if (await isSubredditModerator(input.author?.name, input.subreddit?.name)) {
    return;
  }

  const postId = input.post?.id;
  if (!postId) return;

  // Check both title and selftext so either field can trigger enforcement.
  const searchableText = `${input.post?.title ?? ''}\n${input.post?.selftext ?? ''}`;
  const matchedWord = findMatchedBannedWord(searchableText, words);
  if (!matchedWord) return;

  // Remove offending post if still visible.
  const post = await reddit.getPostById(asT3(postId));
  if (!post.removed) {
    await post.remove();
  }

  // Send a user-visible explanation through modmail.
  await sendRemovalModmail(
    input.subreddit?.name,
    input.author?.name,
    'post',
    matchedWord
  );
}
