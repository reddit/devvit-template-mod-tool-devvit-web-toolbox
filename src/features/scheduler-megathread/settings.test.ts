import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { SettingsValidationRequest } from '@devvit/web/shared';
import {
  validateWeeklyMegathreadBody,
  validateWeeklyMegathreadTitle,
} from './settings.js';

function request(value: string): SettingsValidationRequest<string> {
  return { value, isEditing: true };
}

void test('rejects empty weekly megathread titles', () => {
  assert.deepEqual(validateWeeklyMegathreadTitle(request('   ')), {
    success: false,
    error: 'Weekly megathread title cannot be empty.',
  });
});

void test('rejects weekly megathread titles over 300 characters', () => {
  assert.deepEqual(validateWeeklyMegathreadTitle(request('x'.repeat(301))), {
    success: false,
    error: 'Weekly megathread title must be 300 characters or fewer.',
  });
});

void test('accepts non-empty weekly megathread body text', () => {
  assert.deepEqual(validateWeeklyMegathreadBody(request('Discuss here.')), {
    success: true,
  });
});

void test('rejects weekly megathread body text over 40000 characters', () => {
  assert.deepEqual(validateWeeklyMegathreadBody(request('x'.repeat(40001))), {
    success: false,
    error: 'Weekly megathread body must be 40000 characters or fewer.',
  });
});
