import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { SettingsValidationRequest } from '@devvit/web/shared';
import { validateBannedWords } from './settings.js';

function request(value: string): SettingsValidationRequest<string> {
  return { value, isEditing: true };
}

void test('accepts empty banned word settings', () => {
  assert.deepEqual(validateBannedWords(request('')), { success: true });
});

void test('rejects banned words longer than the template limit', () => {
  assert.deepEqual(validateBannedWords(request('x'.repeat(65))), {
    success: false,
    error: 'Each banned word or phrase must be 64 characters or fewer.',
  });
});
