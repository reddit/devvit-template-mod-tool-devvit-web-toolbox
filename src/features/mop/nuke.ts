import type { Comment, Post } from '@devvit/web/server';
import { reddit } from '@devvit/web/server';
import type { T1, T3, T5 } from '@devvit/shared-types/tid.js';

// Input for "mop from one comment downward".
export type NukeProps = {
  remove: boolean;
  lock: boolean;
  skipDistinguished: boolean;
  commentId: T1;
  subredditId: T5;
};

// Input for "mop all comments under a post".
export type NukePostProps = {
  remove: boolean;
  lock: boolean;
  skipDistinguished: boolean;
  postId: T3;
  subredditId: T5;
};

// Optional filter to skip distinguished comments when requested.
const shouldIncludeComment = (comment: Comment, skipDistinguished: boolean) =>
  !skipDistinguished || !comment.isDistinguished();

async function* getAllCommentsInThread(
  comment: Comment,
  skipDistinguished: boolean
): AsyncGenerator<Comment> {
  // Include current comment first when it passes filter.
  if (shouldIncludeComment(comment, skipDistinguished)) {
    yield comment;
  }

  // Then recursively traverse all descendants.
  const replies = await comment.replies.all();
  for (const reply of replies) {
    yield* getAllCommentsInThread(reply, skipDistinguished);
  }
}

async function* getAllCommentsInPost(
  post: Post,
  skipDistinguished: boolean
): AsyncGenerator<Comment> {
  // Start from top-level comments, then recurse into each thread.
  const comments = await post.comments.all();
  for (const comment of comments) {
    yield* getAllCommentsInThread(comment, skipDistinguished);
  }
}

export async function handleNukePost(props: NukePostProps) {
  // Track runtime duration for operator logs.
  const startTime = Date.now();
  let success = true;
  let message: string;

  const shouldLock = props.lock;
  const shouldRemove = props.remove;
  const skipDistinguished = props.skipDistinguished;

  try {
    // Resolve calling user and target post together.
    const [user, post] = await Promise.all([
      reddit.getCurrentUser(),
      reddit.getPostById(props.postId),
    ]);

    if (!user) {
      return { success: false, message: "Can't get user" };
    }

    // Verify moderator can manage posts before bulk action.
    const modPermissions = await user.getModPermissionsForSubreddit(
      post.subredditName
    );
    const canManagePosts =
      modPermissions.includes('all') || modPermissions.includes('posts');

    console.log(
      `Mod Info: r/${post.subredditName} u/${
        user.username
      } permissions:${modPermissions}: ${
        canManagePosts ? 'Can mod' : 'Cannot mod'
      }`
    );

    if (!canManagePosts) {
      console.info(
        'A user without the correct mod permissions tried to nuke all comments of a post.'
      );
      return {
        message: 'You do not have the correct mod permissions to do this.',
        success: false,
      };
    }

    // Materialize async generator so we can apply lock/remove in bulk.
    const comments: Comment[] = [];
    for await (const eachComment of getAllCommentsInPost(
      post,
      skipDistinguished
    )) {
      comments.push(eachComment);
    }

    if (shouldLock) {
      // Lock all targeted comments, skipping already-locked ones.
      await Promise.all(
        comments.map((comment) => comment.locked || comment.lock())
      );
    }

    if (shouldRemove) {
      // Remove all targeted comments, skipping already-removed ones.
      await Promise.all(
        comments.map((comment) => comment.removed || comment.remove())
      );
    }

    // Build user-facing verb phrase for toast.
    const verbage =
      shouldLock && shouldRemove
        ? 'removed and locked'
        : shouldLock
          ? 'locked'
          : 'removed';

    success = true;
    message = `Comments ${verbage}! Refresh the page to see the cleanup.`;
    const finishTime = Date.now();
    const timeElapsed = (finishTime - startTime) / 1000;
    console.info(
      `${comments.length} comment(s) handled in ${timeElapsed} seconds.`
    );
  } catch (err: unknown) {
    // Collapse unexpected errors into a safe generic message.
    success = false;
    message = 'Mop failed! Please try again later.';
    console.error(err);
  }

  return { success, message };
}

export async function handleNuke(props: NukeProps) {
  // Track runtime duration for operator logs.
  const startTime = Date.now();
  let success = true;
  let message: string;

  const shouldLock = props.lock;
  const shouldRemove = props.remove;
  const skipDistinguished = props.skipDistinguished;

  try {
    // Resolve target comment and current user.
    console.log('getting comment');
    console.log(props);
    console.log(props.commentId);
    const comment = await reddit.getCommentById(props.commentId);
    console.log('comment');
    const user = await reddit.getCurrentUser();
    console.log('current user');

    if (!user) {
      return { success: false, message: "Can't get user" };
    }

    // Verify moderator can manage posts before bulk action.
    const modPermissions = await user.getModPermissionsForSubreddit(
      comment.subredditName
    );
    console.log('mod permissions');
    const canManagePosts =
      modPermissions.includes('all') || modPermissions.includes('posts');
    console.log('validated mod permissions');

    console.log(
      `Mod Info: r/${comment.subredditName} u/${
        user.username
      } permissions:${modPermissions}: ${
        canManagePosts ? 'Can mod' : 'Cannot mod'
      }`
    );

    if (!canManagePosts) {
      console.info(
        'A user without the correct mod permissions tried to comment mop.'
      );
      return {
        message: 'You do not have the correct mod permissions to do this.',
        success: false,
      };
    }

    // Materialize async generator so we can apply lock/remove in bulk.
    const comments: Comment[] = [];
    for await (const eachComment of getAllCommentsInThread(
      comment,
      skipDistinguished
    )) {
      comments.push(eachComment);
    }

    if (shouldLock) {
      // Lock all targeted comments, skipping already-locked ones.
      await Promise.all(
        comments.map((comment) => comment.locked || comment.lock())
      );
    }

    if (shouldRemove) {
      // Remove all targeted comments, skipping already-removed ones.
      await Promise.all(
        comments.map((comment) => comment.removed || comment.remove())
      );
    }

    // Build user-facing verb phrase for toast.
    const verbage =
      shouldLock && shouldRemove
        ? 'removed and locked'
        : shouldLock
          ? 'locked'
          : 'removed';

    success = true;
    message = `Comments ${verbage}! Refresh the page to see the cleanup.`;
    const finishTime = Date.now();
    const timeElapsed = (finishTime - startTime) / 1000;
    console.info(
      `${comments.length} comment(s) handled in ${timeElapsed} seconds.`
    );
  } catch (err: unknown) {
    // Collapse unexpected errors into a safe generic message.
    success = false;
    message = 'Mop failed! Please try again later.';
    console.error(err);
  }

  return { success, message };
}
