# Flair Updater Feature

This feature updates user flair in near real-time when users submit posts or comments.

The flair format is:

- `posts: X | comments: Y`

## What this feature does

- On `onPostSubmit`:
    - increments post count for the author in Redis
    - updates author flair text
- On `onCommentSubmit`:
    - increments comment count for the author in Redis
    - updates author flair text
- Controlled by install setting:
    - `flairUpdaterEnabled`

## Why this is useful in real moderation

- Gives moderators quick context about contributor activity directly in thread UI.
- Helps identify frequent contributors and first-time posters.
- Supports lightweight reputation/progression systems without external services.

## Public API/PRAW approach vs Devvit approach

With Public API/PRAW, this often requires:

- External stream processors for posts/comments.
- A separate queue or worker system for updates.
- Careful rate-limit and failure handling in self-hosted infra.

With Devvit in this template:

- Submission triggers are first-class and typed.
- Storage and flair updates are handled in one runtime flow.
- No external cron or worker fleet needed for this event-driven version.

## Code walkthrough

### `settings.ts`

- `isFlairUpdaterEnabled()` reads `flairUpdaterEnabled`.

### `storage.ts`

Redis hashes:

- `flairUpdater:posts:{subredditId}` -> `username -> post count`
- `flairUpdater:comments:{subredditId}` -> `username -> comment count`

Provides increment and read helpers for both counters.

### `triggers.ts`

- `handlePostSubmitFlairUpdater(...)`
- `handleCommentSubmitFlairUpdater(...)`

Each handler:

1. checks feature toggle
2. validates author username
3. increments corresponding counter
4. reads both totals
5. writes flair as `posts: X | comments: Y`

## Notes on platform limits

This design avoids full-subreddit scan jobs and updates only users who generated new activity.
That is significantly safer for high-volume communities than scheduler-driven global updates.

## Remove this feature

Delete `src/features/flair-updater/`, remove its imports from `src/routes/triggers.ts`, and remove `flairUpdaterEnabled`
from `devvit.json`.
