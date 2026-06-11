export const renderTallyComment = (
  keywords: string[],
  counts: Record<string, number>
) => {
  // Build a simple markdown body so mods can read counts directly in-thread.
  const lines = [
    '## Keyword vote tally',
    '',
    // Always render all configured keywords, including zero values.
    ...keywords.map((keyword) => `- ${keyword}: **${counts[keyword] ?? 0}**`),
  ];

  // Join with newlines to produce final comment markdown text.
  return lines.join('\n');
};
