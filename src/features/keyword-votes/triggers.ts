import { reddit } from '@devvit/web/server';
import type {
  OnCommentSubmitRequest,
  OnPostCreateRequest,
  T1,
  T3,
} from '@devvit/web/shared';
import { getKeywordVoteSettings } from './settings.js';
import {
  ensurePostKeywords,
  getKeywordCounts,
  getTallyCommentId,
  incrementKeywordVote,
  setTallyCommentId,
} from './storage.js';
import { renderTallyComment } from './render.js';

// Normalize event IDs into typed fullname format expected by reddit SDK getters.
function asT1(id: string): T1 {
  return (id.startsWith('t1_') ? id : `t1_${id}`) as T1;
}

function asT3(id: string): T3 {
  return (id.startsWith('t3_') ? id : `t3_${id}`) as T3;
}

async function createOrRefreshTallyComment(
  postId: string,
  keywords: readonly string[]
): Promise<void> {
  // Ensure every configured keyword has a bucket before rendering.
  await ensurePostKeywords(postId, keywords);
  // Read latest counts to render current snapshot.
  const counts = await getKeywordCounts(postId, keywords);
  const body = renderTallyComment(keywords, counts);
  // If we already created a tally comment, edit it in place.
  const existingTallyCommentId = await getTallyCommentId(postId);

  if (existingTallyCommentId) {
    const existingComment = await reddit.getCommentById(
      asT1(existingTallyCommentId)
    );
    await existingComment.edit({ text: body });
    return;
  }

  // Otherwise create a new app-authored tally comment under the post.
  const post = await reddit.getPostById(asT3(postId));
  const comment = await post.addComment({ text: body, runAs: 'APP' });

  try {
    // Distinguish and sticky when possible so the tally stays visible.
    await comment.distinguish(true);
  } catch (error) {
    // Some contexts may not allow sticky/distinguish; keep core feature working.
    console.warn('Failed to distinguish sticky tally comment', error);
  }

  // Save the comment ID for future edits.
  await setTallyCommentId(postId, comment.id);
}

export async function handlePostCreateKeywordVotes(
  input: OnPostCreateRequest
): Promise<void> {
  // Read fresh settings each run so mod changes apply immediately.
  const { enabled, keywords } = await getKeywordVoteSettings();
  if (!enabled) return;

  const postId = input.post?.id;
  if (!postId) return;

  // Seed and render tally comment as soon as post is created.
  await createOrRefreshTallyComment(postId, keywords);
}

export async function handleCommentSubmitKeywordVotes(
  input: OnCommentSubmitRequest
): Promise<void> {
  // Read fresh settings each event.
  const { enabled, keywords } = await getKeywordVoteSettings();
  if (!enabled) return;

  const postId = input.post?.id;
  // Exact-match style command voting: entire comment body must equal keyword.
  const commentBody = input.comment?.body?.trim().toLowerCase();
  if (!postId || !commentBody) return;

  const matchedKeyword = keywords.find((keyword) => keyword === commentBody);
  if (!matchedKeyword) return;

  // Increment keyword bucket and then refresh the sticky tally display.
  await ensurePostKeywords(postId, keywords);
  await incrementKeywordVote(postId, matchedKeyword);
  await createOrRefreshTallyComment(postId, keywords);
}
