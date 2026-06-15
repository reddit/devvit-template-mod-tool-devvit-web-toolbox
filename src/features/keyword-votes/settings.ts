import { settings } from '@devvit/web/server';
import type {
  SettingsValidationRequest,
  SettingsValidationResponse,
} from '@devvit/web/shared';

export type KeywordVoteSettings = {
  enabled: boolean;
  keywords: readonly string[];
};

// Default fallback used when moderators do not provide valid custom keywords.
const DEFAULT_KEYWORDS: readonly string[] = ['!agree', '!disagree'];
// Template guardrail to keep UI manageable and Redis payloads bounded.
const MAX_KEYWORDS = 10;

// Parse raw setting text into candidate keywords.
function parseKeywordsRaw(raw: string | undefined): string[] {
  // No value configured yet.
  if (!raw) return [];

  return (
    raw
      // Allow both newline and comma-separated input styles.
      .split(/[\n,]+/)
      // Normalize spacing and case for deterministic comparisons.
      .map((value) => value.trim().toLowerCase())
      // Ignore empty tokens.
      .filter(Boolean)
  );
}

// Normalize and constrain moderator input into safe runtime keywords.
function normalizeKeywords(raw: string | undefined): string[] {
  const deduped: string[] = [];
  for (const keyword of parseKeywordsRaw(raw)) {
    // Enforce convention: only "!" commands count as vote keywords.
    if (!keyword.startsWith('!')) continue;
    // Keep only unique values in original order.
    if (!deduped.includes(keyword)) deduped.push(keyword);
    // Hard cap for template safety and clarity.
    if (deduped.length >= MAX_KEYWORDS) break;
  }
  return deduped;
}

export async function getKeywordVoteSettings(): Promise<KeywordVoteSettings> {
  // Read install setting toggle.
  const enabled = Boolean(await settings.get<boolean>('keywordVotesEnabled'));
  // Read raw keyword setting text.
  const configured = await settings.get<string>('keywordVoteKeywords');
  // Transform raw input into canonical keyword list.
  const keywords = normalizeKeywords(configured);

  return {
    enabled,
    // Fall back to defaults when input is empty/invalid.
    keywords: keywords.length > 0 ? keywords : DEFAULT_KEYWORDS,
  };
}

export function validateKeywordVoteKeywords(
  request: SettingsValidationRequest<string>
): SettingsValidationResponse {
  // Validate based on parsed input to match runtime behavior.
  const keywords = parseKeywordsRaw(request.value);
  if (keywords.length > MAX_KEYWORDS) {
    return {
      success: false,
      error: `Maximum ${MAX_KEYWORDS} keywords are allowed.`,
    };
  }

  for (const keyword of keywords) {
    // Keep validation strict so runtime and UI expectations stay aligned.
    if (!keyword.startsWith('!')) {
      return {
        success: false,
        error: `Keyword "${keyword}" must start with !.`,
      };
    }
  }

  // Validation passed.
  return { success: true };
}
