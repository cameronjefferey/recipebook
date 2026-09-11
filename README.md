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
- **Share a book with one person.** Everyone you share with gets a link of their
  own. They need no account, can read that one book and nothing else, and cannot
  change a thing. Take one person's link back and it stops working at once,
  without disturbing anybody else's.
- **Or let them add to it.** Somebody with a box of their own can keep a shared
  book on their shelf and put their own recipes in, the way a shared photo
  album works. Their recipes stay theirs: you can read and cook them, not edit
  them, and they leave with their owner if the link is taken back.
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

It also signs a second person up and passes a book between the two boxes, which
needs `DATABASE_URL` and `INVITE_CODE` in the environment (`set -a; source
.env.local`); without them that section says it was skipped rather than
pretending to pass. Run it against `next start` as well as `next dev`: dev-only
instrumentation reports a console error on the shared page that a real build
does not.

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
app/shared      what a guest sees, signed out, one book only
app/api         image serving, capture upload, transcription
lib/ai          transcription prompt and the structured output schema
lib/books       the shelf: membership, the standing books, page ordering
lib/access      who may see a recipe, and who may change it
lib/sharing     tokens, and every read a guest is allowed
lib/ingredients parsing, fraction formatting, and scaling
```

The app shell is exactly one screen tall and the middle scrolls, so the header
and tabs stay put and a page can ask for the height that is actually left rather
than guessing at the chrome. The flip view depends on that.

Books are a join table, not a field on the recipe, because a thing is regularly
both a weeknight dinner and one the children will eat. The standing books
(*Everything*, *Keepers*, *Want to try*, *Best loved*, *Not in a book*) are
derived on read, so they can never drift.

Signing up gets you a box of your own. Joining somebody else's — a household
sharing one collection — needs that box's own invite code, which is a different
permission from the one that lets you make an account at all, and is generated
rather than configured so that being allowed to sign up is not the same as being
allowed to walk into the first box you find.

Once a book can be contributed to, seeing a recipe and changing it stop being
the same question, so they are answered separately in `lib/access.ts`:
`visibleRecipe` is wide (yours, or in a book you have been let into, or in a
book you own) while every write stays scoped to the household that owns the
recipe. Nothing else restates either rule.

A share is one row per person, so each has a token of their own and revoking is
a delete. The token is the entire credential, so every read a guest makes is
scoped by it in `lib/sharing.ts` and nowhere else — including photographs, which
are checked against the recipe's membership of *that* book rather than the
household, or sharing one book would quietly hand over the pictures in all of
them. Shared pages are the one thing the service worker refuses to keep, so
taking a link back is not a half-truth on a device that has already seen it.

Ingredients are stored as structured JSONB rather than plain strings, which is
what makes scaling work. They are edited as ordinary text lines and re-parsed on
save, because editing three tiny inputs per ingredient on a phone is miserable.
`1.5` is stored, `1½` is shown.
