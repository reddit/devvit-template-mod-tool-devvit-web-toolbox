# Mop Feature

Mop is a moderator-initiated bulk moderation tool that removes and/or locks large comment trees with one action.

For moderators coming from Reddit API/PRAW workflows, this feature replaces ad-hoc scripts that walk comment trees and
call remove/lock on each node.

## What It Does

- Adds moderator menu actions for:
  - **Mop comments**: start at a selected comment and process all descendants.
  - **Mop post comments**: process all comments in a selected post.
- Shows a form where moderators choose:
  - remove comments
  - lock comments
  - skip distinguished comments
- Validates permissions and applies operations in bulk.

## Real Moderation Use Cases

- **Brigade cleanup**: quickly neutralize large derailments.
- **Harassment thread containment**: lock/remove deep toxic chains.
- **Emergency event moderation**: stop fast-moving abuse without hand-removing hundreds of comments.

## Reddit API / PRAW vs Devvit

Typical Reddit API/PRAW method:

- Write custom script/command path per moderation workflow.
- Build your own UI entrypoint or run scripts manually by id.
- Handle id parsing, permission checks, and failure reporting yourself.
- Maintain and secure bot infra/credentials externally.

Devvit method in this template:

- Native moderator menu actions in Reddit UI.
- Native form handling and response toasts.
- Triggerless, direct moderator action path with typed IDs and built-in API client.
- Fewer operational dependencies than maintaining standalone moderation scripts.

## Code Walkthrough

### 1) Menu/form definitions

- `menu.ts`
  - `buildNukeForm()` creates the form payload used by route handlers with fields for:
    - `targetId`
    - `remove`
    - `lock`
    - `skipDistinguished`

### 2) Form processing

- `forms.ts`
  - `handleMopCommentSubmit()`:
    - normalizes booleans
    - validates action selection (`remove` or `lock`)
    - validates `t1_` target id
    - calls `handleNuke()`
  - `handleMopPostSubmit()`:
    - same flow but validates `t3_` target id
    - calls `handleNukePost()`

### 3) Core moderation operations

- `nuke.ts`
  - `getAllCommentsInThread()` recursively walks descendants.
  - `getAllCommentsInPost()` iterates top-level and descendants.
  - `handleNuke()` and `handleNukePost()`:
    - verify moderator permissions (`all` or `posts`)
    - collect target comments
    - apply lock/remove operations in parallel
    - return success/failure message for UI toast

## End-to-End Flow

1. Moderator clicks menu item on a comment or post.
2. App shows the Mop form with defaults.
3. Moderator confirms options.
4. Feature validates IDs and permissions.
5. Feature traverses comments and applies remove/lock.
6. Moderator receives immediate success/failure toast.

## Notes for Extension

- Add max-comment guardrails for very large threads.
- Add dry-run mode and summary preview before execution.
- Add modlog/analytics output in Redis for operation audits.

## Remove This Feature

Delete `src/features/mop/`, remove Mop routes/menu wiring in `src/routes/forms.ts` and `src/routes/menu.ts`, and remove
Mop menu/forms entries from `devvit.json`.
