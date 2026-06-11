# Weekly Megathread Scheduler Feature

This feature creates a weekly megathread post on a moderator-selected UTC weekday, and also provides a moderator-only
menu action to create the megathread manually for testing.

## What this feature does

- Adds subreddit install settings for:
    - enable/disable
    - weekday selection (UTC)
    - post title
    - post body
- Runs a daily scheduler task and posts only when:
    - feature is enabled
    - today matches the configured weekday (UTC)
    - a megathread has not already been posted this UTC week
- Supports manual override via moderator menu action (`Create weekly megathread`) that creates a post immediately.

## Why this is useful in real moderation

- Weekly community discussion threads for TV episodes, sports rounds, release notes, or recurring support topics.
- Reduces manual mod effort and keeps recurring content consistent.
- Provides an easy manual trigger for testing or emergency reposts without waiting for schedule time.

## Public API/PRAW approach vs Devvit approach

If this were built as a traditional Public API/PRAW bot, you would usually:

- Host a long-running process or cron job outside Reddit.
- Store schedule state and dedupe markers in your own infrastructure.
- Manage secrets, deployment reliability, retries, and uptime yourself.

With Devvit in this template:

- Scheduler tasks are registered in `devvit.json`.
- Install settings are native and read directly via `settings.get(...)`.
- Redis storage and Reddit posting are available in the same runtime.
- Less external ops surface means fewer failure points and easier onboarding.

## Code walkthrough

### `settings.ts`

- Reads:
    - `weeklyMegathreadEnabled`
    - `weeklyMegathreadDayUtc`
    - `weeklyMegathreadTitle`
    - `weeklyMegathreadBody`
- Applies safe defaults if settings are unset.
- Provides validation helpers for title/body endpoints.

### `storage.ts`

Redis keys:

- `weeklyMegathread:lastCreatedWeek:{subredditId}`
- `weeklyMegathread:lastPostId:{subredditId}`

This is used for week-level idempotency and traceability.

### `handlers.ts`

- `runWeeklyMegathreadDaily()`:
    - checks feature toggle
    - compares current UTC weekday to configured day
    - computes ISO week key
    - prevents duplicate post in the same week
    - creates post and records week/post id
- `createWeeklyMegathreadManual()`:
    - creates a post immediately for moderator-triggered testing
    - does not rely on scheduler day match

## Example configuration

- Day: `monday` (UTC)
- Title: `Weekly Episode Discussion Thread`
- Body includes spoiler instructions, for example:
    - `Use >!spoiler text!< to hide spoilers in comments.`

This mirrors common moderation flows for weekly TV discussion where spoiler etiquette must be clear.

## Remove this feature

Delete `src/features/scheduler-megathread/`, remove its route imports from:

- `src/routes/scheduler.ts`
- `src/routes/menu.ts`
- `src/routes/settings.ts`

Then remove related settings/scheduler/menu entries from `devvit.json`.
