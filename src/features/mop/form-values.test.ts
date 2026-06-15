import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getSubmittedTargetId,
  hasNukeAction,
  normalizeNukeFormValues,
} from './form-values.js';

void test('normalizes missing Mop toggles to false', () => {
  assert.deepEqual(normalizeNukeFormValues({}), {
    remove: false,
    lock: false,
    skipDistinguished: false,
  });
});

void test('detects whether a Mop action was selected', () => {
  assert.equal(
    hasNukeAction({
      remove: false,
      lock: false,
      skipDistinguished: true,
    }),
    false
  );
  assert.equal(
    hasNukeAction({
      remove: true,
      lock: false,
      skipDistinguished: false,
    }),
    true
  );
});

void test('trims submitted Mop target id before falling back', () => {
  assert.equal(
    getSubmittedTargetId({ targetId: ' t1_comment ' }, 't3_post'),
    't1_comment'
  );
});

void test('uses fallback Mop target id when form target is blank', () => {
  assert.equal(getSubmittedTargetId({ targetId: '   ' }, 't3_post'), 't3_post');
});
