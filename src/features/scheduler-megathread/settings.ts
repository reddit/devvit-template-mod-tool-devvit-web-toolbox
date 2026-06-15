import { settings } from '@devvit/web/server';
import type {
  SettingsValidationRequest,
  SettingsValidationResponse,
} from '@devvit/web/shared';

export type Weekday =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

// Default values used when install settings are missing or malformed.
const DEFAULT_TITLE = 'Weekly Episode Discussion Thread';
const DEFAULT_BODY =
  "Welcome to this week's TV discussion thread.\n\nPlease keep spoilers hidden using Reddit spoiler syntax: `>!spoiler text!<` (example: >!the ending reveal!<).\n\nShare your theories, reactions, and favorite moments below.";
const MAX_TITLE_LENGTH = 300;
// Reddit text post bodies support up to 40,000 characters.
const MAX_BODY_LENGTH = 40000;
// Allowed UTC weekday values corresponding to the select options in devvit.json.
const VALID_DAYS: readonly Weekday[] = [
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
  dayUtc: Weekday;
  title: string;
  body: string;
};

function toSettingString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  return undefined;
}

function isWeekday(value: string): value is Weekday {
  return VALID_DAYS.includes(value as Weekday);
}

export async function getWeeklyMegathreadSettings(): Promise<WeeklyMegathreadSettings> {
  // Read all install settings needed for weekly posting.
  const enabled = Boolean(
    await settings.get<boolean>('weeklyMegathreadEnabled')
  );
  const configuredDay = (
    await settings.get<string>('weeklyMegathreadDayUtc')
  )?.toLowerCase();
  const configuredTitle = toSettingString(
    await settings.get<string>('weeklyMegathreadTitle')
  )?.trim();
  const configuredBody = toSettingString(
    await settings.get<string>('weeklyMegathreadBody')
  )?.trim();

  return {
    enabled,
    // Keep day in a known-good set to avoid downstream lookup issues.
    dayUtc:
      configuredDay && isWeekday(configuredDay) ? configuredDay : 'monday',
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

  if (title.length > MAX_TITLE_LENGTH) {
    return {
      success: false,
      error: `Weekly megathread title must be ${MAX_TITLE_LENGTH} characters or fewer.`,
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

  if (body.length > MAX_BODY_LENGTH) {
    return {
      success: false,
      error: `Weekly megathread body must be ${MAX_BODY_LENGTH} characters or fewer.`,
    };
  }

  // Validation passed.
  return { success: true };
}
