import assert from 'node:assert/strict';
import { test } from 'node:test';
import { verifyInstallationSubreddit } from './nuke.js';

void test('allows Mop targets in the installation subreddit', () => {
  assert.equal(
    verifyInstallationSubreddit('t5_install', 't5_install'),
    undefined
  );
});

void test('rejects Mop targets outside the installation subreddit', () => {
  assert.deepEqual(verifyInstallationSubreddit('t5_other', 't5_install'), {
    success: false,
    message: 'You can only mop this subreddit.',
  });
});
