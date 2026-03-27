# Plan: Community Feature — MVP + V2

## TL;DR

Extend the existing community feed with dual-tab filtering (Showcase / Help), post interactions (like, comment with single-level replies, save/bookmark), and UGC compliance (report + bidirectional block). The InstantDB schema ships all V2 entities upfront (follows, enhanced profiles) to avoid future migrations. V2 adds a follow system, "Following" feed, and public user profiles.

---

## Phase 0 — Schema & Data Layer (ships first, supports both phases)

### 0.1 New InstantDB Entities

**`posts` — modify existing entity**

- Add `type: i.string()` — required field, values: `'showcase'` | `'help'`
  - The existing optional `label` field stays for free-form badges; `type` is the structured filter

**`comments` — modify existing entity**

- Add `parentCommentId: i.string().optional()` — self-referencing for single-level replies
  - A reply is a comment where `parentCommentId` points to a top-level comment (depth = 1 max)
  - Top-level comments have `parentCommentId` = undefined

**`savedPosts` — new entity**

- `uniqueKey: i.string().unique()` — `${profileId}_${postId}` (deduplication, like `likes`)
- `createdAt: i.number().indexed()`

**`reports` — new entity**

- `reason: i.string()` — one of: `'spam'` | `'inappropriate'` | `'harassment'` | `'other'`
- `details: i.string().optional()` — free-text description
- `targetType: i.string()` — `'post'` | `'comment'` | `'user'`
- `targetId: i.string()` — ID of the reported entity
- `status: i.string()` — `'pending'` | `'reviewed'` | `'actioned'` (default: `'pending'`)
- `createdAt: i.number().indexed()`

**`blocks` — new entity**

- `uniqueKey: i.string().unique()` — `${blockerId}_${blockedId}` (deduplication)
- `createdAt: i.number()`

**`follows` — new entity (V2, but schema ships now)**

- `uniqueKey: i.string().unique()` — `${followerId}_${followeeId}` (deduplication)
- `createdAt: i.number().indexed()`

### 0.2 New Links

```
savedPosts ←→ profiles  (savedPostsOwner:  many-to-one, forward: owner,  reverse: savedPosts)
savedPosts ←→ posts      (savedPostsPost:   many-to-one, forward: post,   reverse: saves)
reports    ←→ profiles   (reportsReporter:  many-to-one, forward: reporter, reverse: filedReports)
blocks     ←→ profiles   (blocksBlocker:    many-to-one, forward: blocker, reverse: blockedUsers)
blocks     ←→ profiles   (blocksBlocked:    many-to-one, forward: blocked, reverse: blockedBy)
follows    ←→ profiles   (followsFollower:  many-to-one, forward: follower, reverse: following)
follows    ←→ profiles   (followsFollowee:  many-to-one, forward: followee, reverse: followers)
comments   ←→ comments   (commentsParent:   many-to-one, forward: parent,  reverse: replies) [self-referencing]
```

### 0.3 Permission Rules

| Entity     | view          | create   | delete        | update |
| ---------- | ------------- | -------- | ------------- | ------ |
| savedPosts | owner only    | any auth | owner only    | none   |
| reports    | reporter only | any auth | none          | none   |
| blocks     | blocker only  | any auth | blocker only  | none   |
| follows    | any auth      | any auth | follower only | none   |

- `posts.view` stays "any auth" — client-side filtering hides blocked-user posts
- `reports` are write-only from user perspective; admin reviews via dashboard
- `blocks` are private to the blocker; blocked user never sees the block entity

### 0.4 Type Exports (in `src/lib/instant.ts`)

Add convenience types:

- `SavedPost = InstaQLEntity<AppSchema, 'savedPosts', { owner: {}; post: { author: {}; likes: {} } }>`
- `Report = InstaQLEntity<AppSchema, 'reports', { reporter: {} }>`
- `Block = InstaQLEntity<AppSchema, 'blocks', { blocker: {}; blocked: {} }>`
- `Follow = InstaQLEntity<AppSchema, 'follows', { follower: {}; followee: {} }>`

Update existing `Comment` type to include `{ author: {}; replies: { author: {} } }`

### 0.5 Files to Modify

- [instant.schema.ts](instant.schema.ts) — add entities + links
- [instant.perms.ts](instant.perms.ts) — add permission rules
- [src/lib/instant.ts](src/lib/instant.ts) — add type exports

### 0.6 Push Schema

```bash
npx instant-cli@latest push schema
npx instant-cli@latest push perms
```

---

## Phase 1 — MVP Implementation

### Step 1: Post Type Integration (depends on Phase 0)

**Goal:** Add `type` field to post creation and feed filtering.

**Files:**

- [src/lib/forms/schemas.ts](src/lib/forms/schemas.ts) — add `type` field (`z.enum(['showcase', 'help'])`) to `createPostSchema`
- [app/(tabs)/community/create-post.tsx](<app/(tabs)/community/create-post.tsx>) — add type selector (two `SelectionCard`s or segmented control) above caption
- [app/(tabs)/community/index.tsx](<app/(tabs)/community/index.tsx>) — replace "Trending/Newest/Following" filter pills with:
  - **All** (no type filter)
  - **Showcase** (`type === 'showcase'`)
  - **Help / Clinic** (`type === 'help'`)
  - Keep search + sort (trending/newest) as secondary controls
- [src/hooks/use-posts.ts](src/hooks/use-posts.ts) — pass `type` in `createPost()`, add to transaction
- i18n: add keys for type labels, filter names, creation labels

**Pattern reference:** Existing filter pills in [community/index.tsx](<app/(tabs)/community/index.tsx>) (`FEED_FILTERS` array + `activeFilter` state).

Image Requirement: Make the image field strictly required in createPostSchema for both 'showcase' and 'help' types. Visual context is mandatory for both use cases.

Dynamic UX Prompts: When type === 'help' is selected, dynamically change the text input placeholder to prompt for crucial context (e.g., "Describe your issue. Which strain? What grow week? Nutrients used?"). I think it would be actually easier to let the user just select one of his plants and all the required fields get autofilled?

### Step 2: Comments Screen with Single-Level Replies (parallel with Step 1)

**Goal:** Full comment view accessible from post feed; supports top-level comments and one level of replies.

**New files:**

- `app/(tabs)/community/comments.tsx` — route file (form sheet or full screen)
- `src/screens/comments-screen.tsx` — screen component
- `src/hooks/use-comments.ts` — dedicated hook

**Hook (`use-comments.ts`):**

- Query: `db.useQuery({ comments: { author: {}, replies: { author: {} }, $: { where: { 'post.id': postId }, order: { serverCreatedAt: 'asc' } } } })`
- `addComment(postId, body, parentCommentId?)` — sanitize body, create comment, link to post + author + optional parent
- `deleteComment(commentId)` — delete own comment

**Screen layout:**

- Header: post caption summary + comment count
- FlashList of top-level comments (parentCommentId = undefined)
  - Each comment: avatar, author name, time ago, body, "Reply" button, like count (future)
  - Nested: indented replies list below parent (max 1 level, rendered inline)
  - "View N replies" / "Hide replies" toggle per top-level comment
- Bottom: fixed input bar (TextInput + Send button); when replying, show "Replying to @name" chip with dismiss

**Navigation:** Tap comment icon/count on `FeedPost` → `router.push` to comments route with `postId` param (already a stack inside community layout).

**Form sheet vs full screen:** Use full-screen push (not form sheet) since comments can be lengthy. Add as a new `Stack.Screen` in [app/(tabs)/community/\_layout.tsx](<app/(tabs)/community/_layout.tsx>).

**i18n keys (EN + DE):**

- `comments.title`, `comments.placeholder`, `comments.send`, `comments.replyTo`, `comments.viewReplies`, `comments.hideReplies`, `comments.noComments`, `comments.deleteConfirm`

### Step 3: Save/Bookmark Posts (parallel with Steps 1-2)

**Goal:** Users can bookmark posts; view saved posts in a private list.

**New files:**

- `src/hooks/use-saved-posts.ts` — save/unsave/query hook
- `app/(tabs)/community/saved.tsx` — route file
- `src/screens/saved-posts-screen.tsx` — screen component

**Hook (`use-saved-posts.ts`):**

- Query: `db.useQuery({ savedPosts: { post: { author: {}, likes: {}, comments: {} }, $: { where: { 'owner.id': profileId }, order: { serverCreatedAt: 'desc' } } } })`
- `savePost(postId)` — create savedPost with uniqueKey + links
- `unsavePost(savedPostId)` — delete
- `savedPostIds: Set<string>` — derived for quick lookup (same pattern as `likedPostIds` in `use-posts.ts`)

**Feed integration:**

- Add bookmark icon to `FeedPost` component (right side of action row, after share)
- Toggle filled/outline state based on `savedPostIds.has(post.id)`
- Haptic feedback on save (same as like)

**Saved posts screen:**

- Accessible via a header button or profile section (icon in community header)
- Reuses `FeedPost` component in a FlashList
- Empty state: "No saved posts yet"

**Navigation:** Add `saved` screen to community stack in `_layout.tsx`. Access via bookmark-list icon in feed header.

**Route constant:** Add `COMMUNITY_SAVED: '/community/saved'` to `src/lib/routes.ts`

### Step 4: Report Post/Comment/User (depends on Phase 0)

**Goal:** UGC compliance — users can report content and other users.

**New files:**

- `app/(tabs)/community/report.tsx` — form sheet route
- `src/screens/report-screen.tsx` — screen component
- `src/hooks/use-reports.ts` — report submission hook

**Hook (`use-reports.ts`):**

- `submitReport({ targetType, targetId, reason, details? })` — creates report entity, links to reporter profile
- No query needed (write-only from user perspective)

**UI flow:**

1. Long-press on post → context menu (or "..." overflow button on `FeedPost`)
2. Options: "Report Post", "Block User", "Copy Text", "Cancel"
3. "Report Post" → push to report form sheet
4. Report form: reason selection (4 `SelectionCard`s: Spam, Inappropriate, Harassment, Other) + optional text details + Submit button
5. Confirmation: success toast/alert → navigate back

**Comments:** Same "..." menu on each comment for "Report Comment" and "Block User".

**Form sheet preset:** Use `filtersSheet` preset (compact, header visible) for the report form.

**i18n keys:**

- `report.title`, `report.reasons.spam`, `report.reasons.inappropriate`, `report.reasons.harassment`, `report.reasons.other`, `report.detailsPlaceholder`, `report.submit`, `report.success`, `report.error`
- `actions.reportPost`, `actions.reportComment`, `actions.reportUser`, `actions.blockUser`, `actions.copyText`

### Step 5: Block User (depends on Phase 0, parallel with Step 4)

**Goal:** Bidirectional blocking — neither party sees the other's content.

**New files:**

- `src/hooks/use-blocks.ts` — block/unblock/query hook

**Hook (`use-blocks.ts`):**

- Query: `db.useQuery({ blocks: { blocked: {}, $: { where: { 'blocker.id': profileId } } } })`
- Also query reverse: `db.useQuery({ blocks: { blocker: {}, $: { where: { 'blocked.id': profileId } } } })` — for bidirectional hiding
- `blockedUserIds: Set<string>` — union of both directions (users I blocked + users who blocked me)
- `blockUser(targetProfileId)` — creates block entity with uniqueKey + links
- `unblockUser(blockId)` — deletes block entity
- `isBlocked(profileId): boolean` — checks set

**Feed integration:**

- `use-posts.ts` consumes `blockedUserIds` from `use-blocks.ts`
- Filter out posts where `post.author.id` is in `blockedUserIds` (client-side)
- Filter out comments from blocked users similarly
- This is a **client-side filter** since InstantDB doesn't support "NOT IN" permission rules for bidirectional blocks

**Block confirmation:** Alert dialog: "Block @username? You won't see each other's posts or comments." → confirm/cancel

**Unblock path:** "Blocked Users" list accessible from profile screen → tap to unblock (V2 detail, but hook supports it now)

Architecture Note: Client-side filtering for bidirectional blocks is the accepted MVP compromise. InstantDB's perms.ts currently lacks "NOT IN" queries. Fetching data but hiding it via the React UI satisfies App Store compliance without overengineering backend rules.

### Step 6: Feed Polish & Integration (depends on Steps 1-5)

**Goal:** Wire everything together in the feed UI.

**Modifications to [app/(tabs)/community/index.tsx](<app/(tabs)/community/index.tsx>):**

- Replace filter bar with type tabs (All / Showcase / Help)
- Add sort toggle (Trending / Newest) as secondary control
- Integrate blocked-user filtering into `filteredByType` memo chain
- Add "Saved" icon button in header (navigates to saved screen)

**Modifications to `FeedPost` component:**

- Add "..." overflow menu (Pressable → ActionSheet or context menu)
  - Options: Report / Block / Copy / Share (or Delete if own post)
- Add bookmark/save icon in action row
- Comment icon becomes tappable → navigates to comments screen
- For help-type posts: distinctive visual indicator (e.g., badge color, icon)

**i18n updates (EN + DE):**

- All new keys from Steps 1-5 added to `community` namespace
- Update filter labels: `filters.all`, `filters.showcase`, `filters.help`
- Remove/repurpose `filters.trending`, `filters.newest` as sort labels: `sort.trending`, `sort.newest`

---

## Phase 2 — V2 (Fast Follow)

### Step 7: Follow System (depends on Phase 0 schema)

**New files:**

- `src/hooks/use-follows.ts` — follow/unfollow/query hook

**Hook (`use-follows.ts`):**

- Query own following: `db.useQuery({ follows: { followee: {}, $: { where: { 'follower.id': profileId } } } })`
- `followingIds: Set<string>` — set of followee profile IDs
- `followUser(targetProfileId)` — create follow with uniqueKey
- `unfollowUser(followId)` — delete
- `isFollowing(profileId): boolean`

**Integration points:**

- Follow/Unfollow button on user avatars/profiles
- "Following" feed tab filters posts where `post.author.id` is in `followingIds`

### Step 8: Following Feed Tab (depends on Step 7)

**Modifications to [app/(tabs)/community/index.tsx](<app/(tabs)/community/index.tsx>):**

- Add third tab: "Following" (alongside All / Showcase / Help)
- When selected, filter posts to `followingIds` set
- Empty state: "Follow growers to see their posts here"
- Existing `filters.following` i18n key already exists

### Step 9: User Profile Screen (depends on Step 7)

**New files:**

- `app/(tabs)/community/profile/[id].tsx` — route file
- `src/screens/user-profile-screen.tsx` — screen component

**Profile screen layout:**

- Header: avatar, display name, experience level badge
- Stats row: posts count, followers count, following count
- Follow/Unfollow button (or "Edit Profile" if own profile)
- Post grid or list (user's posts, reusing `FeedPost`)
- "..." menu: Report User / Block User

**Query pattern:**

- `db.useQuery({ profiles: { $: { where: { id: targetProfileId } }, posts: { likes: {}, comments: {} }, followers: {}, following: {} } })`

**Navigation:** Tap author avatar/name on `FeedPost` → push to profile screen. Add route constant `COMMUNITY_PROFILE: (id: string) => '/community/profile/${id}'`

### Step 10: Enhanced Profile Entity (depends on Phase 0 schema)

**Optional schema enrichment (if needed for V2 profiles):**

- `profiles` entity may need: `bio: i.string().optional()`, `isPublic: i.boolean()` (default true)
- Permission update: `profiles.view` → "any auth" for public profiles (currently owner-only)

**Decision:** Defer `profiles.view` permission change to V2 implementation. For MVP, profile data visible through post author links is sufficient.

---

## Relevant Files (Summary)

### Schema & Data

- [instant.schema.ts](instant.schema.ts) — add 4 new entities (savedPosts, reports, blocks, follows), modify comments, add 7 new links
- [instant.perms.ts](instant.perms.ts) — add permission rules for new entities
- [src/lib/instant.ts](src/lib/instant.ts) — add type exports

### Hooks (new)

- `src/hooks/use-comments.ts` — comment CRUD with replies
- `src/hooks/use-saved-posts.ts` — bookmark CRUD
- `src/hooks/use-reports.ts` — report submission
- `src/hooks/use-blocks.ts` — block/unblock + bidirectional set
- `src/hooks/use-follows.ts` — follow/unfollow (V2)

### Hooks (modify)

- [src/hooks/use-posts.ts](src/hooks/use-posts.ts) — add `type` to createPost, integrate block filtering

### Screens (new)

- `src/screens/comments-screen.tsx`
- `src/screens/saved-posts-screen.tsx`
- `src/screens/report-screen.tsx`
- `src/screens/user-profile-screen.tsx` (V2)

### Routes (new)

- `app/(tabs)/community/comments.tsx`
- `app/(tabs)/community/saved.tsx`
- `app/(tabs)/community/report.tsx`
- `app/(tabs)/community/profile/[id].tsx` (V2)

### Routes (modify)

- [app/(tabs)/community/\_layout.tsx](<app/(tabs)/community/_layout.tsx>) — add stack screens
- [app/(tabs)/community/index.tsx](<app/(tabs)/community/index.tsx>) — type tabs, block filter, save icon, overflow menu
- [app/(tabs)/community/create-post.tsx](<app/(tabs)/community/create-post.tsx>) — type selector

### Forms

- [src/lib/forms/schemas.ts](src/lib/forms/schemas.ts) — add `type` to createPostSchema, add reportSchema

### i18n

- [src/lib/i18n/locales/en/community.ts](src/lib/i18n/locales/en/community.ts) — all new keys
- [src/lib/i18n/locales/de/community.ts](src/lib/i18n/locales/de/community.ts) — all new keys (DE translations)

### Navigation

- [src/lib/routes.ts](src/lib/routes.ts) — add route constants

---

## Verification

1. **Type-check:** `bun run type-check` passes with all schema/hook/screen changes
2. **Schema push:** `npx instant-cli@latest push schema` and `push perms` succeed against dev app
3. **Post creation:** Create a post with type "showcase" and "help" → verify both appear in feed with correct type filter
4. **Comments:** Add top-level comment, reply to it → verify nesting, "View replies" toggle, reply input chip
5. **Save/Bookmark:** Tap bookmark → verify filled state, navigate to saved list → verify post appears, unsave → verify removal
6. **Report flow:** Tap "..." → Report → select reason → submit → verify report entity created in Instant dashboard
7. **Block flow:** Block user → verify their posts disappear from feed; verify blocked user also cannot see blocker's posts (test with second account)
8. **Offline:** Create post while offline → verify it syncs when reconnected (InstantDB offline store)
9. **Dark mode:** Verify all new screens/components render correctly in both light and dark mode
10. **i18n:** Switch device language to DE → verify all new strings render in German

---

## Decisions

- **Post type field:** New required `type` field (`'showcase'` | `'help'`) — not reusing `label`
- **Comment threading:** Single-level replies via `parentCommentId` self-reference on comments entity
- **Block scope:** Bidirectional — client-side filtering using union of "I blocked" + "blocked me" sets
- **Saved posts:** InstantDB entity (synced across devices), not MMKV
- **Report review:** InstantDB dashboard only — no in-app admin UI for MVP
- **Schema scope:** All V2 entities (follows) ship in Phase 0 to avoid migrations
- **Profile permissions:** Stay owner-only for MVP; widen to "any auth" for public profiles in V2
- **Excluded from scope:** Push notifications, post editing, comment likes, media in comments, admin moderation UI
