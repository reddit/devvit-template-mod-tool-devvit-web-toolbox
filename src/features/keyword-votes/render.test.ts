import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderTallyComment } from './render.js';

void test('renders configured keyword counts in order', () => {
  assert.equal(
    renderTallyComment(['!agree', '!disagree'], {
      '!agree': 3,
      '!disagree': 1,
    }),
    '## Keyword vote tally\n\n- !agree: **3**\n- !disagree: **1**'
  );
});

void test('renders missing keyword counts as zero', () => {
  assert.equal(
    renderTallyComment(['!agree'], {}),
    '## Keyword vote tally\n\n- !agree: **0**'
  );
});
