import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseStoredCount } from './storage.js';

void test('parses missing stored counts as zero', () => {
  assert.equal(parseStoredCount(undefined), 0);
});

void test('parses stored integer counts', () => {
  assert.equal(parseStoredCount('42'), 42);
});

void test('treats malformed stored counts as zero', () => {
  assert.equal(parseStoredCount('not-a-number'), 0);
});
