// Escape regex metacharacters so moderator-entered text is treated literally.
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function findMatchedBannedWord(
  content: string,
  bannedWords: string[]
): string | undefined {
  // Lowercase once so phrase checks can use a cheap includes() call.
  const normalized = content.toLowerCase();

  // Return the first match so callers can include the specific term in modmail.
  for (const bannedWord of bannedWords) {
    // Multi-word entries are treated as phrase matches.
    // Example: "spoiler leak" should match anywhere in the sentence.
    if (bannedWord.includes(' ')) {
      if (normalized.includes(bannedWord)) return bannedWord;
      continue;
    }

    // Single tokens use word boundaries to avoid partial false positives.
    // Example: banned "cat" should not match "education".
    const matcher = new RegExp(`\\b${escapeRegExp(bannedWord)}\\b`, 'i');
    if (matcher.test(content)) return bannedWord;
  }

  // No banned content found.
  return undefined;
}
