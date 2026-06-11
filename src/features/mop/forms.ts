import type { UiResponse } from '@devvit/web/shared';
import { context } from '@devvit/web/server';
import { isT1, isT3 } from '@devvit/shared-types/tid.js';
import { handleNuke, handleNukePost } from './nuke';

// Shape of incoming form values from Reddit client.
export type NukeFormValues = {
  remove?: boolean;
  lock?: boolean;
  skipDistinguished?: boolean;
  targetId?: string;
};

// Coerce optional toggles into strict booleans.
const normalizeValues = (values: NukeFormValues) => ({
  remove: Boolean(values.remove),
  lock: Boolean(values.lock),
  skipDistinguished: Boolean(values.skipDistinguished),
});

// Resolve target id from form data, with post context fallback.
const getTargetId = (values: NukeFormValues) => {
  if (typeof values.targetId === 'string' && values.targetId.trim()) {
    return values.targetId.trim();
  }

  return context.postId;
};

export async function handleMopCommentSubmit(values: NukeFormValues) {
  // Normalize values before validation.
  const normalized = normalizeValues(values);

  // Require at least one moderation action.
  if (!normalized.lock && !normalized.remove) {
    return {
      showToast: 'You must select either lock or remove.',
    } satisfies UiResponse;
  }

  // Guard against invalid ID shape for comment-target flow.
  const targetId = getTargetId(values);
  if (!isT1(targetId)) {
    console.error('targetId is not a T1', targetId);
    return {
      showToast: 'Mop failed! Please try again later.',
    } satisfies UiResponse;
  }

  // Run recursive moderation operation for comment thread.
  const result = await handleNuke({
    ...normalized,
    commentId: targetId,
    subredditId: context.subredditId,
  });

  console.log(
    `Mop result - ${result.success ? 'success' : 'fail'} - ${result.message}`
  );

  // Return toast-friendly response for Reddit client.
  return {
    showToast: `${result.success ? 'Success' : 'Failed'} : ${result.message}`,
  } satisfies UiResponse;
}

export async function handleMopPostSubmit(values: NukeFormValues) {
  // Normalize values before validation.
  const normalized = normalizeValues(values);

  // Require at least one moderation action.
  if (!normalized.lock && !normalized.remove) {
    return {
      showToast: 'You must select either lock or remove.',
    } satisfies UiResponse;
  }

  // Guard against invalid ID shape for post-target flow.
  const targetId = getTargetId(values);
  if (!isT3(targetId)) {
    console.error('targetId is not a T3', targetId);
    return {
      showToast: 'Mop failed! Please try again later.',
    } satisfies UiResponse;
  }

  // Run recursive moderation operation for whole-post comment tree.
  const result = await handleNukePost({
    ...normalized,
    postId: targetId,
    subredditId: context.subredditId,
  });

  console.log(
    `Mop result - ${result.success ? 'success' : 'fail'} - ${result.message}`
  );

  // Return toast-friendly response for Reddit client.
  return {
    showToast: `${result.success ? 'Success' : 'Failed'} : ${result.message}`,
  } satisfies UiResponse;
}
