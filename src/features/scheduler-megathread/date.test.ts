import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getIsoWeekKey } from './date.js';

void test('returns ISO week key for ordinary UTC dates', () => {
  assert.equal(getIsoWeekKey(new Date('2026-06-15T12:00:00Z')), '2026-W25');
});

void test('assigns early January dates to the previous ISO week year when needed', () => {
  assert.equal(getIsoWeekKey(new Date('2021-01-01T00:00:00Z')), '2020-W53');
});
