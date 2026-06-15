import { Hono } from 'hono';
import type { MenuItemRequest, UiResponse } from '@devvit/web/shared';
import { buildNukeForm } from '../features/mop/menu.js';
import { createWeeklyMegathreadManual } from '../features/scheduler-megathread/handlers.js';

// Router for menu actions declared in devvit.json/menu.items.
export const menu = new Hono();

menu.post('/mop-comment', async (c) => {
  // Parse menu payload to access selected target id.
  const request = await c.req.json<MenuItemRequest>();
  console.log('request', request.targetId);
  return c.json<UiResponse>(
    {
      showForm: {
        name: 'mopComment',
        form: buildNukeForm('Mop Comments', request.targetId),
      },
    },
    200
  );
});

menu.post('/mop-post', async (c) => {
  // Parse menu payload to access selected target id.
  const request = await c.req.json<MenuItemRequest>();
  return c.json<UiResponse>(
    {
      showForm: {
        name: 'mopPost',
        form: buildNukeForm('Mop Post Comments', request.targetId),
      },
    },
    200
  );
});

menu.post('/create-weekly-megathread', async (c) => {
  // Payload is unused today, but parsing keeps this route consistent
  // with other menu handlers and easier to extend later.
  await c.req.json<MenuItemRequest>();
  // Delegate to feature handler that performs settings/permission checks.
  const result = await createWeeklyMegathreadManual();

  return c.json<UiResponse>(
    {
      showToast: result.message,
    },
    200
  );
});
