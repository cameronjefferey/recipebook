# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A household, used equally by everyone in it: each person adds recipes, files them, plans the week, and cooks. There is no single "owner" role in daily use; roles exist only in the data (who owns a recipe, who owns a box).

Where it is used: on a phone, often one-handed, and on an iPad at the kitchen counter, frequently landscape in a stand at arm's length, mid-cook with damp fingers. The app is installed to the home screen (PWA) rather than visited in a browser tab.

Secondary audiences, confirmed by the code:

- **Guests** who receive a share link to one box. No account; they can read and cook from that box and nothing else, and the link can be revoked per person.
- **Contributors**: someone with a box of their own who keeps a shared box on their shelf and adds their own recipes to it. Their recipes stay theirs.

Growth path: our family first. Extended family or friends may later get a box of their own via the invite code. It is not aimed at strangers and has nothing to explain to a visitor who does not already know the family.

## Product Purpose

Keep a family's physical recipe collection (handwritten index cards, pages torn from cookbooks and magazines, plus web links and typed-in recipes) in one private, installable place, and make it usable at the stove.

Success is: a recipe worth keeping is photographed once, is findable later, can be cooked from at the counter with the servings scaled, and the original photo is never more than a tap away. Over time the collection accumulates marks of use (Keeper, Want to try, Nope; cook counts) the way a real box does.

## Positioning

The photo is the record; the transcription serves it. Most recipe apps make the structured text the recipe and treat an image as an attachment. Here the photograph of the card or page is the source of truth kept forever, and the Claude transcription exists so the recipe can be searched, scaled, and read in large type. Anything the model could not read confidently is flagged rather than guessed.

It is modelled on one physical object, a family recipe box, not on a recipe feed or a blog. It is private and invite-only. Nothing is sold, marketed, or ranked.

## Operating Context

- **Capture**: camera-first, several cards in one sitting, downscaled in the browser before upload. Transcription by Claude (roughly two cents per page) handles sideways pages, multiple recipes on one page, and "recipe follows" sub-recipes folded into their parent.
- **Import from a link**: a web recipe comes in with its component recipes ("1½ cups street corn salad" that links to its own page) as recipes of their own, matched by normalised source URL. Following stops after one hop. Off-site links are treated as shopping links and left alone.
- **Cooking**: full-screen cook mode outside the tab bar, wake lock on, ingredients tapped off, servings scaled ½×, 1×, 2×, 3×. Component recipes' steps are placed ahead of the parent's.
- **Organising**: boxes (collections) are a join table, so one recipe can live in several. Five standing boxes are derived on read and cannot drift: Everything, Keepers, Want to try, Best loved, Not in a box. Categories act as dividers.
- **Planning**: an optional meal plan ("Cook this week") and a grocery list ordered by store aisle. A household can turn planning off in Settings without losing the list.
- **Sharing**: one row per person per box, token is the whole credential, revoke is a delete. Shared pages are never cached by the service worker.
- **Hosting**: Render free web service that sleeps after 15 minutes idle and takes about a minute to wake; the service worker serves already-opened recipes from cache meanwhile. Postgres lives in a `pinkbox` schema on an existing instance. Migrations run at build.
- **Accounts**: hand-rolled sessions (opaque token, HTTP-only cookie, stored hashed). Creating an account needs the global `INVITE_CODE`; joining an existing household's box needs that box's own generated code.

## Capabilities and Constraints

- Next.js App Router, React 19, TypeScript, Tailwind v4, Drizzle ORM, Anthropic SDK. Node 20.9+.
- The signed-in shell is exactly one screen tall with a scrolling middle, so header and tab bar stay put and pages can use the real remaining height. The flip-through view depends on this.
- Ingredients are structured JSONB (what makes scaling work), edited as plain text lines and re-parsed on save. `1.5` is stored, `1½` is shown.
- Visibility and write permission are answered separately in `lib/access.ts`; every guest read is scoped by token in `lib/sharing.ts`. Images are served through API routes that check access against the box, not the household.
- Tabs today: Box, Add, Plan (Plan only when enabled). Home redirects to `/box`.
- A smoke test (`npm run smoke`) drives a real browser at three phone sizes.

Terminology in the UI: *box* (both the app and a collection), *card* (a recipe), *dividers* (categories), *Keeper / Want to try / Nope*, *cook mode*, *Cook this week*.

Open product facts, recorded rather than decided:

- "Box" currently means three things (the app, a collection, the household). `UX_AUDIT.md` finding 14 names this; no resolution chosen yet.
- Whether categories should keep auto-creating a box from a free-typed string (`fileUnderCategory`) is unresolved.
- Serving scale beyond the four fixed stops is not decided.

## Brand Commitments

- Name: **The Pink Recipe Box** (manifest short name: Recipe Box). Tagline in the README: *Every recipe worth keeping.*
- `BRAND.md` exists but is **a draft, not binding** (confirmed by the user). Its proposals (the pink box as the whole metaphor, one handwriting face for titles, index-card forms, no recipe-blog metadata, plain warm first-person voice) are a starting hypothesis that later design work may preserve, expand, or replace. The shipped UI (`app/globals.css` palette, Caveat + Source Serif, the ribbon and dog-ear marks, the empty-state copy) is the incumbent evidence of how far that draft has been applied.
- No other binding visual constraints were given.

## Evidence on Hand

- `README.md`: feature set, architecture, and the reasoning behind the data model.
- `BRAND.md`: draft brand guide (see above).
- `UX_AUDIT.md` (21 Sep 2026): a prioritised iPad and phone UX audit against the current UI, with wireframe notes. Several P0 items (portrait lock, box as the only front door) have since been addressed in commits; others remain.
- `scripts/seed.ts`: three sample recipes and a ready-made login. `scripts/smoke.mjs`: browser smoke test.
- Live deployment: `https://pink-recipe-box.onrender.com` (free tier, slow to wake).

Absences future work must not fabricate:

- No photographs of the real pink box or the real cards are in the repository; whether any can be supplied is unconfirmed.
- Whether real family recipes (beyond seed data) are loaded is unconfirmed.
- There are no testimonials, customers, metrics, or press, and there never need to be.

## Product Principles

1. **The photo is the record.** The transcription, scaling, and search exist to serve the photographed card, never to replace it.
2. **Everyone in the household is a full user.** No flow may assume a single curator; adding, filing, planning, and cooking are for whoever is holding the device.
3. **Private by default, shared one person at a time.** Every share is one token for one person and is revocable without disturbing anyone else.
4. **Built for the counter.** Anything used mid-cook must work at arm's length, with wet hands, in large type, without losing the user's place.
5. **The everyday box stays simple.** Optional things (meal planning, sharing, contributors) must be able to disappear without leaving holes.

## Accessibility & Inclusion

No formal standard has been set. Known, shipped decisions that encode real user needs: 17px base type for use at the counter without reading glasses; a 48px tap floor (`.tap`) for damp fingers; inputs above the 16px iOS zoom threshold; wake lock in cook mode; large Back / Next in cook mode. `UX_AUDIT.md` finding 10 lists controls that still fall below that floor.
