import { settings } from '@devvit/web/server';

export async function isFlairUpdaterEnabled(): Promise<boolean> {
  // Boolean install setting that toggles all event-driven flair updates.
  return Boolean(await settings.get<boolean>('flairUpdaterEnabled'));
}
