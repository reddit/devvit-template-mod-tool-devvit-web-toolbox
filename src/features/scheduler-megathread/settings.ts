import { settings } from '@devvit/web/server';
import type {
  SettingsValidationRequest,
  SettingsValidationResponse,
} from '@devvit/web/shared';

// Default values used when install settings are missing or malformed.
const DEFAULT_TITLE = 'Weekly Episode Discussion Thread';
const DEFAULT_BODY =
  "Welcome to this week's TV discussion thread.\n\nPlease keep spoilers hidden using Reddit spoiler syntax: `>!spoiler text!<` (example: >!the ending reveal!<).\n\nShare your theories, reactions, and favorite moments below.";
// Allowed UTC weekday values corresponding to the select options in devvit.json.
const VALID_DAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export type WeeklyMegathreadSettings = {
  enabled: boolean;
  dayUtc: string;
  title: string;
  body: string;
};

const toSettingString = (value: unknown): string | undefined => {
  // Devvit select-like settings may arrive as a scalar or array depending
  // on the client shape, so normalize defensively for template stability.
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
};

export async function getWeeklyMegathreadSettings(): Promise<WeeklyMegathreadSettings> {
  // Read all install settings needed for weekly posting.
  const enabled = Boolean(
    await settings.get<boolean>('weeklyMegathreadEnabled')
  );
  const configuredDay = toSettingString(
    await settings.get('weeklyMegathreadDayUtc')
  )?.toLowerCase();
  const configuredTitle = toSettingString(
    await settings.get('weeklyMegathreadTitle')
  )?.trim();
  const configuredBody = toSettingString(
    await settings.get('weeklyMegathreadBody')
  )?.trim();

  return {
    enabled,
    // Keep day in a known-good set to avoid downstream lookup issues.
    dayUtc:
      configuredDay && VALID_DAYS.includes(configuredDay)
        ? configuredDay
        : 'monday',
    // Use defaults if setting is blank or undefined.
    title: configuredTitle || DEFAULT_TITLE,
    body: configuredBody || DEFAULT_BODY,
  };
}

export function validateWeeklyMegathreadTitle(
  request: SettingsValidationRequest<string>
): SettingsValidationResponse {
  // Trim so whitespace-only values are rejected.
  const title = request.value?.trim() ?? '';
  if (title.length === 0) {
    return {
      success: false,
      error: 'Weekly megathread title cannot be empty.',
    };
  }

  if (title.length > 300) {
    return {
      success: false,
      error: 'Weekly megathread title must be 300 characters or fewer.',
    };
  }

  // Validation passed.
  return { success: true };
}

export function validateWeeklyMegathreadBody(
  request: SettingsValidationRequest<string>
): SettingsValidationResponse {
  // Trim so whitespace-only values are rejected.
  const body = request.value?.trim() ?? '';
  if (body.length === 0) {
    return {
      success: false,
      error: 'Weekly megathread body cannot be empty.',
    };
  }

  if (body.length > 40000) {
    return {
      success: false,
      error: 'Weekly megathread body must be 40000 characters or fewer.',
    };
  }

  // Validation passed.
  return { success: true };
}
