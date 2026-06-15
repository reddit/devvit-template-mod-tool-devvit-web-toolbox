import { Hono } from 'hono';
import type {
  OnAppInstallRequest,
  OnCommentSubmitRequest,
  OnPostCreateRequest,
  OnPostSubmitRequest,
  TriggerResponse,
} from '@devvit/web/shared';
import { handlePostCreateKeywordVotes } from '../features/keyword-votes/triggers.js';
import { handleCommentSubmitKeywordVotes } from '../features/keyword-votes/triggers.js';
import {
  handleCommentSubmitBannedWords,
  handlePostSubmitBannedWords,
} from '../features/banned-words/triggers.js';
import {
  handleCommentSubmitFlairUpdater,
  handlePostSubmitFlairUpdater,
} from '../features/flair-updater/triggers.js';

// Router for trigger endpoints declared in devvit.json/triggers.
export const triggers = new Hono();

async function runFeatureSafely(
  featureName: string,
  runner: () => Promise<void>
): Promise<void> {
  try {
    await runner();
  } catch (error) {
    // Keep one feature failure from breaking all other trigger handlers.
    console.error(`[triggers] Feature "${featureName}" failed`, error);
  }
}

triggers.post('/on-app-install', async (c) => {
  // Parse install trigger payload.
  const input = await c.req.json<OnAppInstallRequest>();
  console.log('App installed to subreddit: r/' + input.subreddit?.name);

  return c.json<TriggerResponse>(
    {
      status: 'success',
    },
    200
  );
});

triggers.post('/on-post-create', async (c) => {
  // Parse post-create trigger payload.
  const input = await c.req.json<OnPostCreateRequest>();
  await runFeatureSafely('keyword-votes:on-post-create', async () => {
    await handlePostCreateKeywordVotes(input);
  });

  return c.json<TriggerResponse>({}, 200);
});

triggers.post('/on-comment-submit', async (c) => {
  // Parse comment-submit trigger payload.
  const input = await c.req.json<OnCommentSubmitRequest>();
  // Run all interested feature handlers in parallel and isolate failures.
  await Promise.all([
    runFeatureSafely('keyword-votes:on-comment-submit', async () => {
      await handleCommentSubmitKeywordVotes(input);
    }),
    runFeatureSafely('banned-words:on-comment-submit', async () => {
      await handleCommentSubmitBannedWords(input);
    }),
    runFeatureSafely('flair-updater:on-comment-submit', async () => {
      await handleCommentSubmitFlairUpdater(input);
    }),
  ]);

  return c.json<TriggerResponse>({}, 200);
});

triggers.post('/on-post-submit', async (c) => {
  // Parse post-submit trigger payload.
  const input = await c.req.json<OnPostSubmitRequest>();
  // Run all interested feature handlers in parallel and isolate failures.
  await Promise.all([
    runFeatureSafely('banned-words:on-post-submit', async () => {
      await handlePostSubmitBannedWords(input);
    }),
    runFeatureSafely('flair-updater:on-post-submit', async () => {
      await handlePostSubmitFlairUpdater(input);
    }),
  ]);

  return c.json<TriggerResponse>({}, 200);
});
