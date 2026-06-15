import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildNukeForm } from './menu.js';

void test('builds a Mop form with the selected target id', () => {
  const form = buildNukeForm('Mop Comments', 't1_comment');

  assert.equal(form.title, 'Mop Comments');
  assert.equal(form.acceptLabel, 'Mop');
  assert.equal(form.cancelLabel, 'Cancel');
  assert.equal(form.fields.length, 4);
  assert.deepEqual(form.fields[0], {
    name: 'targetId',
    label: 'Target ID',
    type: 'string',
    helpText: 'Auto-filled from the selected item.',
    required: true,
    defaultValue: 't1_comment',
  });
});

void test('defaults Mop moderation actions to remove only', () => {
  const form = buildNukeForm('Mop Post Comments', 't3_post');

  assert.deepEqual(form.fields, [
    {
      name: 'targetId',
      label: 'Target ID',
      type: 'string',
      helpText: 'Auto-filled from the selected item.',
      required: true,
      defaultValue: 't3_post',
    },
    {
      name: 'remove',
      label: 'Remove comments',
      type: 'boolean',
      defaultValue: true,
    },
    {
      name: 'lock',
      label: 'Lock comments',
      type: 'boolean',
      defaultValue: false,
    },
    {
      name: 'skipDistinguished',
      label: 'Skip distinguished comments',
      type: 'boolean',
      defaultValue: false,
    },
  ]);
});
