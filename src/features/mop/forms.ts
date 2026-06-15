import type { UiResponse } from '@devvit/web/shared';
import { isT1, isT3 } from '@devvit/web/shared';
import { context } from '@devvit/web/server';
import { handleNuke, handleNukePost } from './nuke.js';
import {
  getSubmittedTargetId,
  hasNukeAction,
  normalizeNukeFormValues,
  type NukeFormValues,
} from './form-values.js';

export type { NukeFormValues } from './form-values.js';

export async function handleMopCommentSubmit(
  values: NukeFormValues
): Promise<UiResponse> {
  // Normalize values before validation.
  const normalized = normalizeNukeFormValues(values);

  // Require at least one moderation action.
  if (!hasNukeAction(normalized)) {
    return {
      showToast: 'You must select either lock or remove.',
    };
  }

  // Guard against invalid ID shape for comment-target flow.
  const targetId = getSubmittedTargetId(values, context.postId);
  if (!isT1(targetId)) {
    console.error('targetId is not a T1', targetId);
    return {
      showToast: 'Mop failed! Please try again later.',
    };
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
  };
}

export async function handleMopPostSubmit(
  values: NukeFormValues
): Promise<UiResponse> {
  // Normalize values before validation.
  const normalized = normalizeNukeFormValues(values);

  // Require at least one moderation action.
  if (!hasNukeAction(normalized)) {
    return {
      showToast: 'You must select either lock or remove.',
    };
  }

  // Guard against invalid ID shape for post-target flow.
  const targetId = getSubmittedTargetId(values, context.postId);
  if (!isT3(targetId)) {
    console.error('targetId is not a T3', targetId);
    return {
      showToast: 'Mop failed! Please try again later.',
    };
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
  };
}
