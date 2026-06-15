import type {
  Comment,
  ModeratorPermission,
  Post,
  User,
} from '@devvit/web/server';
import { reddit } from '@devvit/web/server';
import type { T1, T3, T5 } from '@devvit/web/shared';

export type NukeResult = {
  success: boolean;
  message: string;
};

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

function failedUnexpectedly(error: unknown): NukeResult {
  console.error(error);
  return {
    success: false,
    message: 'Mop failed! Please try again later.',
  };
}

function canManagePosts(permissions: readonly ModeratorPermission[]): boolean {
  return permissions.includes('all') || permissions.includes('posts');
}

function shouldIncludeComment(
  comment: Comment,
  skipDistinguished: boolean
): boolean {
  return !skipDistinguished || !comment.isDistinguished();
}

async function getCurrentUserAndPost(
  postId: T3
): Promise<{ user: User; post: Post } | NukeResult> {
  try {
    const [user, post] = await Promise.all([
      reddit.getCurrentUser(),
      reddit.getPostById(postId),
    ]);

    if (!user) {
      return { success: false, message: "Can't get user" };
    }

    return { user, post };
  } catch (error) {
    return failedUnexpectedly(error);
  }
}

async function getCurrentUserAndComment(
  commentId: T1
): Promise<{ user: User; comment: Comment } | NukeResult> {
  try {
    const [user, comment] = await Promise.all([
      reddit.getCurrentUser(),
      reddit.getCommentById(commentId),
    ]);

    if (!user) {
      return { success: false, message: "Can't get user" };
    }

    return { user, comment };
  } catch (error) {
    return failedUnexpectedly(error);
  }
}

async function verifyPostModerationPermissions(
  user: User,
  subredditName: string,
  deniedLogMessage: string
): Promise<NukeResult | undefined> {
  let modPermissions: ModeratorPermission[];
  try {
    modPermissions = await user.getModPermissionsForSubreddit(subredditName);
  } catch (error) {
    return failedUnexpectedly(error);
  }

  const allowed = canManagePosts(modPermissions);
  const formattedPermissions = modPermissions.join(',');
  console.log(
    `Mod Info: r/${subredditName} u/${user.username} permissions:${formattedPermissions}: ${
      allowed ? 'Can mod' : 'Cannot mod'
    }`
  );

  if (allowed) return undefined;

  console.info(deniedLogMessage);
  return {
    message: 'You do not have the correct mod permissions to do this.',
    success: false,
  };
}

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

async function collectComments(
  comments: AsyncGenerator<Comment>
): Promise<Comment[] | NukeResult> {
  const collected: Comment[] = [];

  try {
    for await (const comment of comments) {
      collected.push(comment);
    }
  } catch (error) {
    return failedUnexpectedly(error);
  }

  return collected;
}

async function applyCommentActions(
  comments: readonly Comment[],
  shouldLock: boolean,
  shouldRemove: boolean
): Promise<NukeResult | undefined> {
  try {
    if (shouldLock) {
      await Promise.all(
        comments
          .filter((comment) => !comment.locked)
          .map((comment) => comment.lock())
      );
    }

    if (shouldRemove) {
      await Promise.all(
        comments
          .filter((comment) => !comment.removed)
          .map((comment) => comment.remove())
      );
    }
  } catch (error) {
    return failedUnexpectedly(error);
  }

  return undefined;
}

function getActionLabel(shouldLock: boolean, shouldRemove: boolean): string {
  if (shouldLock && shouldRemove) return 'removed and locked';
  return shouldLock ? 'locked' : 'removed';
}

function logDuration(startTime: number, commentCount: number): void {
  const timeElapsed = (Date.now() - startTime) / 1000;
  console.info(`${commentCount} comment(s) handled in ${timeElapsed} seconds.`);
}

function successResult(shouldLock: boolean, shouldRemove: boolean): NukeResult {
  const actionLabel = getActionLabel(shouldLock, shouldRemove);
  return {
    success: true,
    message: `Comments ${actionLabel}! Refresh the page to see the cleanup.`,
  };
}

export async function handleNukePost(
  props: NukePostProps
): Promise<NukeResult> {
  const startTime = Date.now();
  const resolved = await getCurrentUserAndPost(props.postId);
  if ('success' in resolved) return resolved;

  const permissionFailure = await verifyPostModerationPermissions(
    resolved.user,
    resolved.post.subredditName,
    'A user without the correct mod permissions tried to nuke all comments of a post.'
  );
  if (permissionFailure) return permissionFailure;

  const comments = await collectComments(
    getAllCommentsInPost(resolved.post, props.skipDistinguished)
  );
  if ('success' in comments) return comments;

  const actionFailure = await applyCommentActions(
    comments,
    props.lock,
    props.remove
  );
  if (actionFailure) return actionFailure;

  logDuration(startTime, comments.length);
  return successResult(props.lock, props.remove);
}

export async function handleNuke(props: NukeProps): Promise<NukeResult> {
  const startTime = Date.now();
  const resolved = await getCurrentUserAndComment(props.commentId);
  if ('success' in resolved) return resolved;

  const permissionFailure = await verifyPostModerationPermissions(
    resolved.user,
    resolved.comment.subredditName,
    'A user without the correct mod permissions tried to comment mop.'
  );
  if (permissionFailure) return permissionFailure;

  const comments = await collectComments(
    getAllCommentsInThread(resolved.comment, props.skipDistinguished)
  );
  if ('success' in comments) return comments;

  const actionFailure = await applyCommentActions(
    comments,
    props.lock,
    props.remove
  );
  if (actionFailure) return actionFailure;

  logDuration(startTime, comments.length);
  return successResult(props.lock, props.remove);
}
