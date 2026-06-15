import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import {
  handleMopCommentSubmit,
  handleMopPostSubmit,
  type NukeFormValues,
} from '../features/mop/forms.js';

// Router for form submit endpoints declared in devvit.json/forms.
export const forms = new Hono();

forms.post('/mop-comment-submit', async (c) => {
  // Parse submitted form values into typed payload.
  const values = await c.req.json<NukeFormValues>();
  console.log('values', values);
  // Delegate business logic to feature module.
  const response = await handleMopCommentSubmit(values);

  // Return UI response consumed by Reddit client.
  return c.json<UiResponse>(response, 200);
});

forms.post('/mop-post-submit', async (c) => {
  // Parse submitted form values into typed payload.
  const values = await c.req.json<NukeFormValues>();
  console.log('values', values);
  // Delegate business logic to feature module.
  const response = await handleMopPostSubmit(values);

  // Return UI response consumed by Reddit client.
  return c.json<UiResponse>(response, 200);
});
