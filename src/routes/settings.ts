import { Hono } from 'hono';
import type {
  SettingsValidationRequest,
  SettingsValidationResponse,
} from '@devvit/web/shared';
import { validateKeywordVoteKeywords } from '../features/keyword-votes/settings.js';
import { validateBannedWords } from '../features/banned-words/settings.js';
import {
  validateWeeklyMegathreadBody,
  validateWeeklyMegathreadTitle,
} from '../features/scheduler-megathread/settings.js';

// Router for optional server-side settings validation endpoints.
// Validation endpoints are referenced from devvit.json setting definitions.
export const settingsRoutes = new Hono();

settingsRoutes.post('/validate-keyword-vote-keywords', async (c) => {
  // Parse incoming value payload from settings UI.
  const request = await c.req.json<SettingsValidationRequest<string>>();
  // Reuse feature-level validator for consistent rules.
  return c.json<SettingsValidationResponse>(
    validateKeywordVoteKeywords(request),
    200
  );
});

settingsRoutes.post('/validate-banned-words-list', async (c) => {
  // Parse incoming value payload from settings UI.
  const request = await c.req.json<SettingsValidationRequest<string>>();
  // Reuse feature-level validator for consistent rules.
  return c.json<SettingsValidationResponse>(validateBannedWords(request), 200);
});

settingsRoutes.post('/validate-weekly-megathread-title', async (c) => {
  // Parse incoming value payload from settings UI.
  const request = await c.req.json<SettingsValidationRequest<string>>();
  // Reuse feature-level validator for consistent rules.
  return c.json<SettingsValidationResponse>(
    validateWeeklyMegathreadTitle(request),
    200
  );
});

settingsRoutes.post('/validate-weekly-megathread-body', async (c) => {
  // Parse incoming value payload from settings UI.
  const request = await c.req.json<SettingsValidationRequest<string>>();
  // Reuse feature-level validator for consistent rules.
  return c.json<SettingsValidationResponse>(
    validateWeeklyMegathreadBody(request),
    200
  );
});
