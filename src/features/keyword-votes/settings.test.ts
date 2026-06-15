import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { SettingsValidationRequest } from '@devvit/web/shared';
import { validateKeywordVoteKeywords } from './settings.js';

function request(value: string): SettingsValidationRequest<string> {
  return { value, isEditing: true };
}

void test('accepts comma and newline separated keyword commands', () => {
  assert.deepEqual(
    validateKeywordVoteKeywords(request('!agree, !disagree\n!maybe')),
    { success: true }
  );
});

void test('rejects keywords that do not start with bang', () => {
  assert.deepEqual(validateKeywordVoteKeywords(request('!agree, agree')), {
    success: false,
    error: 'Keyword "agree" must start with !.',
  });
});

void test('rejects more than ten keyword commands', () => {
  const value = Array.from({ length: 11 }, (_, index) => `!vote${index}`).join(
    '\n'
  );

  assert.deepEqual(validateKeywordVoteKeywords(request(value)), {
    success: false,
    error: 'Maximum 10 keywords are allowed.',
  });
});
