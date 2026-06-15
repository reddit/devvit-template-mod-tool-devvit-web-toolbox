import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createServer, getServerPort } from '@devvit/web/server';
import { api } from './routes/api.js';
import { forms } from './routes/forms.js';
import { menu } from './routes/menu.js';
import { schedulerRoutes } from './routes/scheduler.js';
import { settingsRoutes } from './routes/settings.js';
import { triggers } from './routes/triggers.js';

// Root app for all HTTP endpoints served by the Devvit Web server bundle.
const app = new Hono();
// Internal sub-router groups Devvit internal endpoints (menu/forms/triggers/etc).
const internal = new Hono();

// Mount internal endpoint routers.
internal.route('/menu', menu);
internal.route('/form', forms);
internal.route('/triggers', triggers);
internal.route('/scheduler', schedulerRoutes);
internal.route('/settings', settingsRoutes);

// Mount public API router (template placeholder).
app.route('/api', api);
app.route('/internal', internal);

// Start Node server with Devvit-provided server factory and assigned port.
serve({
  fetch: app.fetch,
  createServer,
  port: getServerPort(),
});
