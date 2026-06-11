import type { FormField } from '@devvit/shared-types/shared/form.js';

// Build form fields shown when moderators invoke a Mop action.
export const buildNukeFields = (targetId: string): FormField[] => [
  {
    // Thing ID supplied by menu context (comment or post).
    name: 'targetId',
    label: 'Target ID',
    type: 'string',
    helpText: 'Auto-filled from the selected item.',
    required: true,
    defaultValue: targetId,
  },
  {
    // Whether to remove comments in the target scope.
    name: 'remove',
    label: 'Remove comments',
    type: 'boolean',
    defaultValue: true,
  },
  {
    // Whether to lock comments in the target scope.
    name: 'lock',
    label: 'Lock comments',
    type: 'boolean',
    defaultValue: false,
  },
  {
    // Optional safety toggle to avoid touching distinguished mod/admin comments.
    name: 'skipDistinguished',
    label: 'Skip distinguished comments',
    type: 'boolean',
    defaultValue: false,
  },
];

// Build a complete modal form payload for Reddit clients.
export const buildNukeForm = (title: string, targetId: string) => ({
  fields: buildNukeFields(targetId),
  title,
  acceptLabel: 'Mop',
  cancelLabel: 'Cancel',
});
