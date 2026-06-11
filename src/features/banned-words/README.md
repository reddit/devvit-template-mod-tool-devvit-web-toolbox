# Banned Words Feature

This feature provides automatic text policy enforcement for new posts and comments using a moderator-defined banned
list.

For teams used to Public API or PRAW moderation bots, this is the Devvit-native equivalent of an "automod-lite worker"
pattern where the app reacts to content submission events and takes immediate moderation action.

## What It Does

- Reads subreddit-level settings for:
    - feature enable/disable
    - banned words/phrases list
- Runs on both:
    - `onCommentSubmit`
    - `onPostSubmit`
- Matches content against configured banned terms.
- Skips enforcement for subreddit moderators.
- Removes matching content immediately.
- Sends a modmail message to the author explaining why the content was removed.

## Real Moderation Use Cases

- **Zero-tolerance slur/harassment controls** for high-volume communities.
- **Spoiler leak terms** for episode-release windows.
- **Known spam phrase suppression** before moderator queue backlog grows.
- **Brand safety moderation** for communities with strict language requirements.

## Public API / PRAW vs Devvit

Public API / PRAW implementation usually requires:

- A hosted bot process watching comment and submission streams.
- External persistence/config and operational controls for moderation lists.
- Manual reliability engineering (deployments, process health, retries).
- Secret handling and API credentials management in your infra.

Devvit implementation in this template gives you:

- Native content submit triggers.
- Install settings available directly to trigger handlers.
- Built-in Reddit moderation and modmail clients in one runtime.
- Reduced surface area for credentials and hosting security mistakes.

## Code Walkthrough

### 1) Settings and validation

- `settings.ts`
    - `getBannedWordsSettings()` reads:
        - `bannedWordsEnabled`
        - `bannedWordsList`
    - `parseBannedWords()`:
        - splits by newline/comma
        - trims
        - lowercases
        - deduplicates
    - `validateBannedWords()` currently enforces max entry length (64 chars).

### 2) Matching engine

- `matching.ts`
    - Single-word terms use regex word boundaries (`\b...\b`) to reduce accidental substring matches.
    - Multi-word phrases use substring includes checks on normalized text.
    - Returns the first matched banned term for enforcement/audit messaging.

### 3) Trigger handlers

- `triggers.ts`
    - `isSubredditModerator()`:
        - looks up author mod permissions for the event subreddit
    - `handleCommentSubmitBannedWords()`:
        - checks settings
        - skips moderators
        - matches `comment.body`
        - removes the comment via Reddit API
        - sends modmail to user
    - `handlePostSubmitBannedWords()`:
        - checks settings
        - skips moderators
        - matches combined `post.title + post.selftext`
        - removes the post
        - sends modmail to user
    - `sendRemovalModmail()`:
        - creates a modmail conversation with context for the author

## End-to-End Flow

1. Moderators set `bannedWordsEnabled = true` and define banned entries.
2. User submits post/comment.
3. Trigger handler receives event payload and checks settings.
4. If the author is a subreddit moderator, no action is taken.
5. If content matches a banned term:
    - content is removed
    - user receives modmail explanation
6. If not matched: no action is taken.

## Notes for Extension

- Add allow-lists/exceptions for other trusted users or specific flairs (moderators are already exempt).
- Add audit logging keys in Redis for enforcement analytics.
- Add escalation behavior (for example, temporary ban thresholds).

## Remove This Feature

Delete `src/features/banned-words/`, remove its imports from `src/routes/triggers.ts`, and remove related settings from
`devvit.json`.
