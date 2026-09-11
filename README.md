# The Pink Recipe Box

A private, installable recipe app built around photographing recipes: handwritten
index cards, and pages torn out of cookbooks and cooking magazines.

*Every recipe worth keeping.*

## What it does

- **Photograph a recipe.** Camera-first capture, several cards in one sitting,
  downscaled in the browser before upload.
- **Reads the page for you.** Claude transcribes the photo, corrects for pages
  shot sideways, finds more than one recipe on a page, folds a "recipe follows"
  sub-recipe into its parent as a labelled section, and flags anything it could
  not read confidently.
- **Keeps the original forever.** The photo is the source of truth and is one tap
  away from every recipe. The transcription exists so recipes are searchable and
  scalable.
- **A shelf of recipe books.** Make as many as you like — Breakfast, Sides, What
  the kids will eat — and file a recipe into as many of them as fit. Open one and
  swipe from page to page, ordered A–Z, newest, or best loved. Five books are
  always on the shelf and keep themselves current, including *Not in a book*, so
  nothing quietly goes missing.
- **Cook from it.** Scale servings by ½×, 2×, or 3×, tap ingredients off as you
  go, and use a full-screen cook mode that keeps the screen awake.
- **Marks what is worth repeating.** Keeper, Want to try, Nope. Recipes gather a
  dog-eared corner and butter splatters the more they are cooked.
- Also imports from a web link, or you can type a recipe in by hand.

## Running it locally

Requires Node 20.9+ and Postgres.

```bash
createdb pinkbox
cp .env.example .env.local     # then fill in the values below
npm install
npm run db:migrate
npm run dev
```

`.env.local` needs:

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. Tables live in a `pinkbox` schema. |
| `SESSION_SECRET` | `openssl rand -base64 32` |
| `ANTHROPIC_API_KEY` | Required for reading photos. Roughly two cents per page. |
| `INVITE_CODE` | Anyone with this can create an account, so keep it to family. |

To load sample data, including three recipes and a ready-made login:

```bash
npx tsx scripts/seed.ts
```

With the dev server running, `PB_TOKEN=<session token> npm run smoke` drives a
real browser at three phone sizes over the shelf, the pager and every page of
the shell. The token is printed by the seed script. It uses the Chrome already
on the machine, so nothing is downloaded, and it cleans up after itself.

## Deploying to Render

`render.yaml` describes a free Node web service. Two values must be set by hand
in the dashboard, since they are secrets: `DATABASE_URL` and `ANTHROPIC_API_KEY`
(plus `INVITE_CODE`). `SESSION_SECRET` is generated for you.

The database is a `pinkbox` schema inside an existing Postgres instance rather
than a new one, so it costs nothing extra. Deliberately **not** a free Render
Postgres, which is deleted 30 days after creation.

The free web service sleeps after 15 minutes idle and takes about a minute to
wake. The service worker hides most of this: recipes already opened on the phone
load instantly from cache while the server wakes up.

## How it is put together

Next.js App Router, TypeScript, Tailwind v4, Drizzle ORM, and the Anthropic SDK.
Sessions are hand-rolled rather than delegated to an auth library: an opaque
token in an HTTP-only cookie, stored only as a hash.

```
app/(auth)      sign in, join
app/(app)       the box, the shelf, add, search, settings, recipe pages
app/(app)/book  the shelf, and /book/[id] to flip through one
app/cook/[id]   full-screen cook mode, outside the tab bar
app/api         image serving, capture upload, transcription
lib/ai          transcription prompt and the structured output schema
lib/books       the shelf: membership, the standing books, page ordering
lib/ingredients parsing, fraction formatting, and scaling
```

The app shell is exactly one screen tall and the middle scrolls, so the header
and tabs stay put and a page can ask for the height that is actually left rather
than guessing at the chrome. The flip view depends on that.

Books are a join table, not a field on the recipe, because a thing is regularly
both a weeknight dinner and one the children will eat. The standing books
(*Everything*, *Keepers*, *Want to try*, *Best loved*, *Not in a book*) are
derived on read, so they can never drift.

Ingredients are stored as structured JSONB rather than plain strings, which is
what makes scaling work. They are edited as ordinary text lines and re-parsed on
save, because editing three tiny inputs per ingredient on a phone is miserable.
`1.5` is stored, `1½` is shown.
