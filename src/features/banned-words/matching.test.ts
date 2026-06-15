import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findMatchedBannedWord } from './matching.js';

void test('matches banned phrases case-insensitively', () => {
  assert.equal(
    findMatchedBannedWord('This has a Spoiler Leak inside.', ['spoiler leak']),
    'spoiler leak'
  );
});

void test('matches single banned words without partial matches', () => {
  assert.equal(findMatchedBannedWord('The cat is here.', ['cat']), 'cat');
  assert.equal(findMatchedBannedWord('Education matters.', ['cat']), undefined);
});

void test('treats regex metacharacters as literal text', () => {
  assert.equal(findMatchedBannedWord('Do not use a+b here.', ['a+b']), 'a+b');
});
