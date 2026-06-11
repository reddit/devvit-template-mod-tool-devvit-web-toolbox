# Devvit Mod Tool Template

A template for building Reddit moderation tools using Devvit Web with feature-isolated server modules.  
Each moderation capability lives in its own folder under `src/features` so developers can remove a feature by deleting its folder and unregistering its route wiring.

## Included Features

- **Mop Moderation Tool**: Moderator menu actions to remove/lock comment trees or all comments in a post.
- **Keyword Vote Tallies**: Configurable `!keyword` vote comments with a sticky tally comment per post.
- **Banned Words Enforcement**: Auto-removes matching posts/comments and sends a modmail notice to the author; subreddit moderators are exempt.
- **Weekly Megathread Scheduler**: Posts a recurring weekly megathread on a configurable UTC weekday, plus manual mod-triggered creation.
- **Flair Updater**: Updates user flair on each post/comment event using Redis-backed counts (`posts: X | comments: Y`).

### Feature Docs

- [Mop README](src/features/mop/README.md)
- [Keyword Votes README](src/features/keyword-votes/README.md)
- [Banned Words README](src/features/banned-words/README.md)
- [Weekly Megathread Scheduler README](src/features/scheduler-megathread/README.md)
- [Flair Updater README](src/features/flair-updater/README.md)

## Tech Stack

- [Devvit](https://developers.reddit.com/): Reddit's platform for building and deploying apps
- [Vite](https://vite.dev/): Fast build tool for the web components
- [Hono](https://hono.dev/): Lightweight web framework for backend logic
- [TypeScript](https://www.typescriptlang.org/): Type-safe development

## Getting Started

1. **Clone this template** or use it as a starting point for your mod tool
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure your app** in `devvit.json`:
   - Update the app name
   - Set your development subreddit
4. **Start developing**:
   ```bash
   npm run dev
   ```
5. **Test your changes** in your development subreddit

## Project Structure

```text
src/
├── index.ts                  # Main server setup and route mounting
├── features/
│   ├── mop/
│   │   ├── forms.ts          # Mop form handling logic
│   │   ├── menu.ts           # Mop form field definitions
│   │   └── nuke.ts           # Mop moderation operations
│   ├── keyword-votes/
│   │   ├── README.md
│   │   ├── render.ts         # Sticky tally comment rendering
│   │   ├── settings.ts       # Keyword settings parsing/validation
│   │   ├── storage.ts        # Redis storage for tallies/comment ids
│   │   └── triggers.ts       # Post create + comment submit handlers
│   ├── banned-words/
│   │   ├── README.md
│   │   ├── matching.ts       # Word/phrase matching rules
│   │   ├── settings.ts       # Banned words settings parsing/validation
│   │   └── triggers.ts       # Post/comment enforcement + modmail
│   ├── scheduler-megathread/
│   │   ├── README.md
│   │   ├── handlers.ts       # Scheduled/manual megathread creation logic
│   │   ├── settings.ts       # Megathread settings parsing/validation
│   │   └── storage.ts        # Weekly idempotency Redis keys
│   └── flair-updater/
│       ├── README.md
│       ├── settings.ts       # Flair updater feature toggle access
│       ├── storage.ts        # Redis post/comment counters
│       └── triggers.ts       # Post/comment submission handlers
└── routes/
    ├── api.ts                # Public API endpoints (placeholder)
    ├── forms.ts              # Mop form submit route handlers
    ├── menu.ts               # Mop menu route handlers
    ├── scheduler.ts          # Scheduler task endpoints
    ├── settings.ts           # Install setting validation endpoints
    └── triggers.ts           # App lifecycle/content trigger endpoints
```

## Customizing Your Mod Tool

This template is designed to be easily customizable:

1. **Modify existing actions**: Edit the Mop logic in `src/features/mop/`.
2. **Add/remove isolated features**: Add a folder under `src/features/` and wire/unwire it in `src/routes/*` and `devvit.json`.
3. **Add new menu items**: Update `devvit.json` and add handlers in `src/routes/menu.ts`.
4. **Add API endpoints**: Extend `src/routes/api.ts` for external integrations.

## Configuration Overview

- **Install settings** are configured in `devvit.json` under `settings.subreddit`.
- **Triggers** are configured in `devvit.json` and handled in `src/routes/triggers.ts`.
- **Scheduled jobs** are configured in `devvit.json.scheduler.tasks` and handled in `src/routes/scheduler.ts`.
- **Feature toggles** are checked inside each feature's `settings.ts`.

## Commands

- `npm run dev`: Starts development mode with live reload on your test subreddit
- `npm run build`: Builds your mod tool for production
- `npm run deploy`: Uploads a new version of your app to Reddit
- `npm run launch`: Publishes your app for review and public use
- `npm run login`: Authenticates your CLI with Reddit
- `npm run type-check`: Runs TypeScript type checking, linting, and formatting

## Development Notes

- **Permissions**: This template requires `redis: true` and Reddit API moderator scope in `devvit.json`.
- **User Types**: Mop menu items are restricted to `moderator`.
- **Feature isolation**: Each feature folder is intentionally self-contained for template portability.

## Deployment

1. Test thoroughly in your development subreddit
2. Run `npm run deploy` to upload your app
3. Use `npm run launch` to submit for Reddit's app review process
4. Once approved, users can install your mod tool from Reddit's app directory

This template provides a modular starting point for building Reddit moderation tools that are easy to extend and easy to remove feature-by-feature.
