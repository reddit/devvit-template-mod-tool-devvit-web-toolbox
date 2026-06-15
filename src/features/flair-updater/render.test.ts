import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderUserFlairText } from './render.js';

void test('renders post and comment counts for user flair', () => {
  assert.equal(renderUserFlairText(4, 12), 'posts: 4 | comments: 12');
});
