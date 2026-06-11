# Keyword Votes Feature

This feature implements comment-triggered tallying for `!keyword` votes and keeps a sticky comment updated with totals.

For moderators familiar with Reddit's Public API or PRAW bots, this is the Devvit-native equivalent of an always-on "
vote bot" pattern (for example, community verdict signals similar to what users know from communities like
r/AmItheAsshole or position markers like r/ChangeMyView-style participation).

## What It Does

- Watches new posts and creates a sticky tally comment for each post (when enabled).
- Watches new comments and checks whether the full comment body exactly matches one configured keyword (
  case-insensitive).
- Increments per-post counters in Redis and updates the sticky tally comment after each matching vote.
- Lets moderators configure up to 10 keywords in install settings (defaults to `!agree` and `!disagree` if
  empty/invalid).

## Real Moderation Use Cases

- **Fast sentiment pulse**: "Is this rule update good for the community?" with `!agree` / `!disagree`.
- **Structured moderation feedback**: Use keywords like `!approve`, `!needs-context`, `!off-topic`.
- **Low-friction crowd triage**: Let trusted users quickly mark threads for follow-up without custom UI.

## Public API / PRAW vs Devvit

If you were implementing this with Public API + PRAW:

- You would typically run and host a long-lived bot process.
- You would poll streams/listings and manage retries/backoff/rate-limit behavior.
- You would store state externally (DB/Redis), protect credentials, and handle deployment security.
- You would need custom logic to keep one authoritative sticky tally comment per post.

With Devvit in this template:

- Trigger delivery (`onPostCreate`, `onCommentSubmit`) is already integrated.
- App settings are first-class (no custom settings UI server required).
- Redis storage is integrated through Devvit permissions and runtime context.
- The app runs in Reddit's app runtime model, reducing credential/secrets exposure compared to self-hosted bots.

## Code Walkthrough

### 1) Settings and validation

- `settings.ts`
    - `getKeywordVoteSettings()` reads:
        - `keywordVotesEnabled`
        - `keywordVoteKeywords`
    - `normalizeKeywords()` lowercases, trims, deduplicates, filters to `!`-prefixed values, and caps at 10.
    - `validateKeywordVoteKeywords()` enforces:
        - max 10 entries
        - each keyword must start with `!`

### 2) Storage model

- `storage.ts`
    - `keywordVotes:counts:{postId}` (Redis hash): keyword -> count
    - `keywordVotes:tallyComment:{postId}` (Redis key): sticky tally comment id
    - `ensurePostKeywords()` initializes missing hash fields to `0`.
    - `incrementKeywordVote()` increments a single keyword count atomically.

### 3) Trigger handlers

- `triggers.ts`
    - `handlePostCreateKeywordVotes()`:
        - checks setting toggle
        - ensures counters exist
        - creates/refreshes tally comment
    - `handleCommentSubmitKeywordVotes()`:
        - checks setting toggle
        - matches exact keyword comment body (normalized)
        - increments Redis counter
        - refreshes tally comment
    - `createOrRefreshTallyComment()`:
        - edits existing tally comment if known
        - otherwise creates a new APP-authored comment and attempts `distinguish(true)` for sticky behavior

### 4) Rendering

- `render.ts`
    - Builds markdown output:
        - header
        - one line per configured keyword with current count

## End-to-End Flow

1. Moderator enables feature and configures keywords in app install settings.
2. Post is created -> app seeds counters and creates sticky tally comment.
3. User comments `!agree` (or another configured keyword) -> trigger fires.
4. App increments that keyword count in Redis.
5. Sticky tally comment is edited to reflect latest totals.

## Notes for Extension

- Current template behavior counts every matching comment (no per-user dedupe).
- If you want "one vote per user per post", add a voter key like `keywordVotes:voters:{postId}:{username}` and guard
  increments.
- If you want keyword aliases, map aliases to canonical bucket names before incrementing.

## Remove This Feature

Delete `src/features/keyword-votes/`, remove imports from `src/routes/triggers.ts`, and remove related settings from
`devvit.json`.
