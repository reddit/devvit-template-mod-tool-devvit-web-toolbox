import type { Form } from '@devvit/web/shared';

// Build a complete modal form payload for Reddit clients.
export function buildNukeForm(title: string, targetId: string): Form {
  return {
    fields: [
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
    ],
    title,
    acceptLabel: 'Mop',
    cancelLabel: 'Cancel',
  };
}
