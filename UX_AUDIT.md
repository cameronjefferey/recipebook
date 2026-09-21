# UX audit — The Pink Recipe Box

For Mom, on an iPad at the counter, and on a phone. Reviewed 21 September 2026 against `BRAND.md`, `README.md`, and the current UI. No screens were redesigned in this change.

The live site at `https://pink-recipe-box.onrender.com/recipes` was waking from the free-tier sleep described in the README and never returned the app’s own HTML during this pass, so the findings below are from the code the site is built from. Where the README and the screens disagree, that is called out.

The test from the brand guide is the test used here: would this feel like opening that pink box and flipping a card, or like a recipe app with a pink theme?

---

## Executive summary

The voice, the colors, and the idea of the box are already right. Empty states talk like a person, the pink is dusty rather than candy, body type is a readable serif at 17px because this is used on a counter without reading glasses, and cook mode (big type, a wake lock, a large Next) is the most tablet-ready screen in the app. The ribbon and the dog-ear are the kind of marks the brand guide asks for.

What feels rigid is the frame around that. Every signed-in screen is a phone column (`max-w-lg`, about 512px) centered on the cream page, and the installed app asks to stay in portrait. On an iPad the box never gets bigger than a phone. Finding a recipe means learning two overlapping systems — a newest-first photo grid under Recipes, and a shelf of boxes you flip through under Box — while Keepers, Want to try, and Everything exist in both. Once a card is filed there is no way to correct it, and no button that throws it out, even though delete already exists on the server. Start cooking sits at the bottom of a long page, and cook mode then makes her choose between the ingredient list and the step.

The highest-value change is not a new feature. Let the iPad be one open card (or an open book), make “the box” the only front door, and let her fix a card the way she would cross out a line and write in the margin. Soften the chrome so it stops behaving like a five-tab app.

---

## What’s working well

- **The object is legible.** Palette in `app/globals.css` matches the brand guide: dusty box pink, warm paper, browned ink, pencil grey, and one faint blue-grey rule. Pink is an accent and a header, not a gradient theme.
- **The words sound like the family.** “The box is empty”, “start with a card from the kitchen drawer”, “tap one open and see what’s inside”, “Filing it away…”. Short, dry, no blog voice. That is `BRAND.md` §3, and it should be protected while the layout changes.
- **Type size is intentional.** `html { font-size: 17px }` is called out for one-handed, no-glasses use. Inputs sit above the 16px iOS zoom threshold. Cook mode steps are about 1.6rem with 64px Back / Next.
- **Cook mode respects the kitchen.** It leaves the tab bar (`app/cook/[id]`), keeps the screen awake, checks ingredients off, and scales by halves and doubles. The ingredient check is a whole row, not a tiny box.
- **The original photo stays one tap away** (“See the original”). The transcription is for search and scaling; the card photo is still the source of truth. That matches the README and the brand guide.
- **Adding starts with the camera**, then photos, a link, or typing. Ingredients are edited as lines, not three tiny fields per line — the README already names that as a phone problem, and the review screen got it right.
- **The flip book and the lid** (`components/book-client.tsx`, `components/box-card.tsx`) are the screens that actually feel like the box. They should become the default, not a second tab.
- **Meal planning can disappear.** Settings turns the Plan tab off without deleting the list. Good. It should stay optional so the everyday box stays simple.
- **Safe areas, a 48px `.tap` utility, and a PWA install hint** show the phone was thought about. Several controls never use that floor; those are findings below, not a missing idea.

---

## How someone moves through it today

| What she is trying to do | Where it actually lives |
| --- | --- |
| See recipes | `/recipes` — status tabs (Everything, Keepers, Want to try, Nope), then category pills, then a 2-column grid, newest first (`app/(app)/recipes/page.tsx`, `components/box-grid.tsx`) |
| Open one card | `/r/[id]` — `components/recipe-view.tsx` |
| Flip through a set | `/box` shelf, then `/box/[id]` pager. Also “Flip through from here” → `/box/all?at=…` |
| Search | Separate tab, `/search`. Submit the form; nothing filters as she types |
| Filter | Status and category on `/recipes`. A tag on a card links to `/recipes?tag=…` but the page never shows that filter |
| Cook | “Start cooking” at the bottom of the card → `/cook/[id]`, outside the tab bar |
| Add | Camera, library, paste a link (`/add/link`), type (`/add/write`), then review (`/add/review/[id]`) |
| File into a collection | “In these boxes” chips on the card, twice. A category string also silently creates a box (`fileUnderCategory` in `lib/books.ts`) |
| Favorites | Not a heart. Keeper / Want to try / Nope on the card, plus standing boxes that repeat those ideas |
| Plan the week | Optional Plan tab, “Cook this week”, and Select on the grid |
| Share | One box (`/box/[id]/share`) or the whole household (Settings) |

Standing boxes (`lib/books.ts`): Everything, Keepers, Want to try, Best loved, Not in a box. The README still says “Not in a book” and `app/(app)/book`. The screens say box, and the route is `/box`.

---

## Prioritized findings

### P0 — Must fix for Mom on an iPad

#### 1. The iPad is a phone, letterboxed

**What’s wrong.** The signed-in shell caps the scrolling column and the tab bar at `max-w-lg` (`app/(app)/layout.tsx`, `components/tab-bar.tsx`). The shared book does the same (`app/shared/[token]/page.tsx`). The recipe grid is always two columns (`components/box-grid.tsx`). The web app manifest sets `orientation: "portrait"` (`app/manifest.ts`), so once it is on the home screen it asks the iPad to stay upright.

**Why it hurts.** An iPad on the counter is often landscape, in a stand, at arm’s length. She gets a ~512px strip and a lot of empty cream. Photos, titles, and steps stay phone-sized on a screen that could hold an index card at a size she can read across the kitchen. Portrait lock fights the stand. The brand guide wants a card and a box, which have width; this layout cannot become that without a breakpoint.

**Recommendation.** Below a phone width, keep today’s column. From roughly a small tablet up, let the shell grow to one large card or an open book (about 720–960px of content, not edge-to-edge dashboard). Remove the portrait lock (`any`, or omit it). Do not turn the grid into a masonry feed — `BRAND.md` §6 is explicit that browsing is not a feed. The iPad shape is one card filling the page, or two pages with a gutter.

#### 2. A filed card cannot be corrected, or thrown out

**What’s wrong.** After save, the card can be marked Keeper, filed in boxes, scaled, and cooked. It cannot be edited. The write form (`app/(app)/add/write/page.tsx`) and the transcription review (`components/review-client.tsx`) are create-only. `deleteRecipe` in `lib/actions/recipes.ts` is never used by a screen. Review keeps `description` and `tags` on the draft and saves them, but the form never shows those fields, so a bad tag or a wrong sentence is filed unseen. Category is a blank text field, and `fileUnderCategory` then creates a real box from whatever was typed — “Dessert” and “Desserts” become two dividers and two chips.

**Why it hurts.** Handwriting and cookbook photos will be misread. The rigid feeling is a mistake she can see and cannot fix, on a device that has room to put the photo on one side and the correction on the other. A recipe box that won’t let you cross out a line is not her box.

**Recommendation.** “Correct this card” on the recipe, reusing the line editors she already meets at review. On iPad, pin the original photo beside the form; on the phone, keep it above, as review does now. Editable: title, category, ingredients, steps, the margin note, where it came from. Category should be the dividers she already has, plus “a new one”, not an unguarded string that mints a box. Add “Throw this card out” on that same screen, in the page’s own words, and say that the photo goes with it. Do not add prep-time badges or other blog fields — `BRAND.md` §7 says those stay off unless they were on the card. If a time was read off the page, let it live in the note.

#### 3. Cooking makes her scroll, then pick list or step

**What’s wrong.** On the card, “Start cooking” is the last block, after ingredients, steps, notes, a second copy of the box picker, tags, and the source (`components/recipe-view.tsx`). The scale chips are `h-9` (36px). The scale and the checked-off ingredients live only in that screen’s memory; `/cook/[id]` starts over at 1× with nothing checked. Cook mode (`components/cook-mode.tsx`) replaces the whole screen: Ingredients or one step, never both. Done and “I made this” use `router.push` back to the card, and the card’s Back button calls `history.back()` (`components/back-button.tsx`), so Back walks into cook mode again.

**Why it hurts.** At the counter the step and the list need to be in the same glance. An iPad has the width; the phone at least has a sticky bar. A 36px chip is under the 48px floor `.tap` already declares, and it is a control she uses with a damp finger. The Back loop feels like the app is stuck.

**Recommendation.** Put “Start cooking” and the scale with the title, and keep them stuck to the bottom on a phone while she reads. On iPad, cook as a split: ingredients on the left, the current step on the right, the same large Next / Back she already has. Pass the scale into cook mode (a query like `?x=2` is enough) and keep ingredient checks when she flips between list and step. Leave cook mode with `replace`, or `back()` when she came from the card or the book, so Back returns to where she was flipping. Keep the wake lock.

#### 4. Two front doors, and the friendly one is the second tab

**What’s wrong.** Recipes is a photo grid, newest first, with status tabs and a sideways row of category pills (`app/(app)/recipes/page.tsx`, `listRecipes` orders by `createdAt`). Box is a shelf of tins, then a real page-turner. The status tabs and the standing books say the same thing twice (Everything, Keepers, Want to try). Categories are a third organizer, and they also become boxes. Nothing on the grid says the row of pills scrolls; later dividers sit off-screen. Opening a recipe (`/r/…`) matches no tab, so the bar looks idle. The brand guide says the homepage *is* the box, categories are the tabbed dividers, and moving through recipes should feel like flipping.

**Why it hurts.** She has to remember which tab knows the answer. The grid is a feed, which the brand guide tells you not to build, and it is sorted like a timeline rather than a box. The flip interaction she would actually enjoy is behind Box, then a second tap, and on the iPad it is still trapped in the phone column (finding 1). Horizontal pills are a common place tablets fail: the thumb thinks that is the whole list.

**Recommendation.** One front door called the box. Dividers are the categories she uses (Mains, Sides, Baking, and the ones she names), shown as tabs that wrap or sit in a vertical strip on iPad — not a single unscrolled row. The thing in the middle is a card she can turn, with search when she wants to jump (finding 5). Keeper / Want to try / Nope stay marks on the card, not a second way to slice the whole collection. Custom boxes can remain for “what the kids will eat”, but they should not be duplicated by an automatic box per category string, and they should not share the tab bar with an entirely different grid. A–Z belongs on that front door; today it exists only inside a box (`BOOK_ORDERS` in `lib/books.ts`).

---

### P1 — High value, takes the rigidity out

#### 5. Search is a separate errand, and it misses half the card

**What’s wrong.** Search is its own tab (`app/(app)/search/page.tsx`). The field is `autoFocus`, so the keyboard opens immediately. Results appear only after submit. There is no clear. The query matches title, description, notes, and the ingredient JSON (`lib/recipes.ts`). It does not match category, tags, or “where it came from”.

**Why it hurts.** On an iPad the keyboard covers a huge part of an already narrow column, before she has typed. Remembering a cookbook name or “that salad” and landing in the wrong tab feels like the box has a rule she didn’t set. A recipe box is shuffled with your hands; search is for jumping, and it should sit on the same table as the cards.

**Recommendation.** A search field on the box. Do not autofocus it on a tablet. Filter the cards in place, including category, source, and tags. “Nothing matched” should name what she typed and offer to show everything again, in the same hand as the empty-box line.

#### 6. A filter can empty the box and then lie about it

**What’s wrong.** Tags on a card go to `/recipes?tag=…`. The page applies `tag` and never draws it, so there is no chip to remove. If a status, category, and tag together match nothing, the empty state still says “The box is empty” and offers “Add the first recipe” (`app/(app)/recipes/page.tsx`).

**Why it hurts.** She thinks the recipe is gone. The fix looks like adding a duplicate. That is a trust problem on a small screen where the active filter was never visible.

**Recommendation.** Show a removable slip (“showing holiday”, “Keepers · Baking”). When a filter is on and the list is empty, say nothing matched and clear the slip. Save “The box is empty” for a box that truly has no cards.

#### 7. Checking a transcription is a long phone form

**What’s wrong.** Review (`components/review-client.tsx`) stacks a short preview, then every field. The zoom layer closes on any tap, including the photo, and Close is `absolute top-4 right-4`, which a full-bleed image and the iPad safe area can cover. “Add a line” is a text link with no 48px target. Save is only at the bottom. “Review N photos” opens the first capture only (`components/capture-client.tsx`). On Add, a photo that failed or hasn’t been read sits in “Waiting for you” with no action (`app/(app)/add/page.tsx` links only when status is `ready`).

**Why it hurts.** This is the longest, most careful task, and the iPad is the right place for it: photo still, text beside it, thumb on Save. Today the photo scrolls away, zoom is easy to dismiss with the same finger that was trying to look closer, and a failed read looks stuck.

**Recommendation.** On a wide screen, fix the photo in a side column with a zoom that stays up until Close. Sticky “Save to my box”. Make add-line and remove-line real 48px controls. After one photo is filed, offer the next one in the same sitting. On a failed photo: “Try reading it again” and “Throw the photo out”.

#### 8. Servings only go by half, one, two, and three

**What’s wrong.** Both the card and cook mode offer ½×, 1×, 2×, 3× and nothing else. A card that serves 4 cannot become “we’re six” without her doing the math. The factor does not follow her into cook mode (finding 3).

**Why it hurts.** Family cooking is rarely a clean double. Four rigid stops feel like the app’s rule, not the recipe’s.

**Recommendation.** Keep those four as shortcuts. When the card knows a serving count, also ask how many people, and scale from that. One control, same place on the phone and on the iPad split.

#### 9. Turning the page fights scrolling the page

**What’s wrong.** The book is a horizontal snap track, and each leaf scrolls vertically inside it (`components/book-client.tsx`). A diagonal thumb on a tablet often scrolls the recipe instead of turning the card, or the reverse. The A–Z / Newest / Best loved pills are links that load a new URL, and the opener only honors `?at=` on the way in, so changing order drops her at the first page. The die button is 40×40. A guest looking at a shared book gets the pages with Open and Start cooking removed (`showActions={false}` on `app/shared/[token]/page.tsx`), so they never get the big-type cook view.

**Why it hurts.** The flip is the best idea in the app and the easiest one to fumble on an iPad. Losing her place when she sorts is a small punishment for a normal tap. A sister cooking from a shared link is exactly the person who needed cook mode.

**Recommendation.** On a wide screen, turn pages with the existing buttons and a swipe that starts on the card’s edge, and let the body scroll on its own. Keep the page she was on when the order changes, or say she is back at the front. Give a guest the same cook screen, without any control that writes.

#### 10. The chrome is smaller than the reading type

**What’s wrong.** `.tap` aims at 48px, and primary buttons use it. A lot of everyday controls do not:

| Control | Size | Where |
| --- | --- | --- |
| Status tabs | 40px tall | `app/(app)/recipes/page.tsx` |
| Category chips, book-order pills | 36px | recipes page, `book-client.tsx` |
| Scale chips on the card | 36px | `recipe-view.tsx` (cook mode’s are 44px) |
| Tags | 32px | `recipe-view.tsx` |
| Box chips, “Cook this week” | 40px | `book-picker.tsx`, `meal-plan-toggle.tsx` |
| Tab labels | ~12px (`0.7rem`) | `tab-bar.tsx`, under a 17px body |
| Share / “can add” checkboxes | native ~16–20px | `share-manager.tsx` |
| Ingredient row on the card | padding, no min height | `recipe-view.tsx` |

The bar has five tabs, six when Plan is on, inside the same 512px cap. Install help tells an iPad user to use the Share button at the bottom of Safari (`components/install-hint.tsx`). On iPad that control is in the toolbar, often at the top, and the label is not always the word Share.

**Why it hurts.** The 17px body is for her eyes; the navigation is for a younger phone. Missed taps on chips and checks read as “this app is fussy”. Six equal tabs, with nothing selected on the card she is reading, is the rigid app frame around a warm interior.

**Recommendation.** Anything she taps is 48px, including chips, tags, checks, and add-line. Tab labels at least 15px. After finding 4, the bar can be Box, Add, and Plan (if she uses it), with search on the box and Settings under the wordmark — fewer, larger targets. On the recipe, keep Box selected. Rewrite the install note for iPad: toolbar share icon, then Add to Home Screen.

#### 11. “In these boxes” is a wall, and it appears twice

**What’s wrong.** `BookPicker` is rendered under the title and again under the notes (`recipe-view.tsx`). Every box is a toggle chip. Because categories mint boxes, the wall grows by itself. “+ New box” expands into name, Add, and Cancel in one row (`book-picker.tsx`), which wraps awkwardly in the phone column and stays awkward on the iPad only because the column never widens.

**Why it hurts.** Filing should be “this also lives under Sides”, one decision. A duplicated chip cloud is work, and it pushes Start cooking further down (finding 3).

**Recommendation.** One place on the card: the boxes it is already in, named in the handwriting, and “File in another” opening a short list. Creating a box can stay, as its own step, not a third button squeezed beside the keyboard.

#### 12. Select-for-the-week is a mode she can fall into

**What’s wrong.** If meal planning is on, the grid grows a Select control (`components/box-grid.tsx`). Select makes every card a checkbox and blocks opening the recipe. There is no sentence explaining the mode. “Start a new week”, deleting a box, and taking a share back all use the browser `confirm()` (`plan-client.tsx`, `book-menu.tsx`, `share-manager.tsx`), which on iPad is a small system dialog, easy to accept by mistake. The share page says people “cannot change anything” (`app/(app)/box/[id]/share/page.tsx`) and the form underneath offers “Let them add their own recipes”.

**Why it hurts.** Modes that change what a tap means are the rigid feeling. A confirm she didn’t quite read can clear the grocery list. The share sentence and the checkbox disagree, so the careful case (someone may add) is the one the intro denies.

**Recommendation.** If she plans meals, say so in a line and keep Select visually secondary to opening a card. On iPad, Plan can be two columns: what’s cooking, and the grocery list, with 48px rows. Replace `confirm()` with a short panel in the page: what will be cleared, and a pink button that matches the rest. Make the share intro match the checkbox in one sentence.

---

### P2 — Polish, still in the brand

#### 13. It still reads as a pink-themed app in places the brand guide warned about

**What’s wrong.** Titles use Caveat (`app/layout.tsx`). The guide asks for one person’s handwriting and warns off a generic script; Caveat is a very common Google face, so titles can read as “handwriting font” rather than Mom’s pen. Cards are 12px rounded rectangles with a soft drop shadow (`--radius-card`, `components/ui.tsx`, `recipe-card.tsx`). The grid is perfectly even — no slight rotation, no uneven edge. Icons are a neat stroke set (magnifying glass, gear, camera in `components/icons.tsx`). They are not Font Awesome, but they are still an app icon family; the guide wants a star, a check, a dog-ear. Field labels and eyebrows are small, bold, and tracked-out uppercase, which is a familiar website pattern. The header is a solid pink bar on every screen. Cards show “min prep · min cook · serves” whenever those numbers exist (`recipe-view.tsx`, `book-client.tsx`). The guide says not to invent recipe-blog metadata; showing what was actually on the card is fair, leading with it like a blog is not.

**Why it hurts.** None of this blocks cooking. Together it is why the box can feel like a template wearing the right colors. On a large iPad screen the pink bar, the pill chips, and the perfect grid are more visible, not less.

**Recommendation.** Keep the palette and the serif body — those pass the test. Let the ribbon, the dog-ear, and the butter marks stay; they are the hand-drawn marks. Ease the grid: a degree or two of rotation on some cards only, corners closer to a real index card, shadow only where a card actually sits on another card. On iPad, retire the full-width pink bar in favor of the wordmark on the cream, the way the login screen already does (`components/wordmark.tsx`). Tuck times into the margin note. If Caveat keeps feeling like a font sample, replace it with a single more irregular hand, still one face for every title.

#### 14. “Box” means three different things

**What’s wrong.** The app is the pink box. A collection is also a box. Settings says “Share this whole box” for the household, while Box → Share hands over one collection. The README’s “book” and the UI’s “box” are the same feature. Standing copy says “Not in a box”; the README says “Not in a book”.

**Why it hurts.** Mild on the phone, confusing the moment she tries to share with a sister: which box, and can they change it?

**Recommendation.** In the UI she sees, the app is the pink box and the things inside it are dividers (or cards she has clipped together). Household sharing stays in Settings, in a plainer line: someone who lives here and should see all of it. One word in the README and the screen for the unfiled pile.

#### 15. Small rough edges

- **Write vs review.** Typing a recipe has no “where it came from” (`app/(app)/add/write/page.tsx`). Review does. The margin note is the brand’s favorite field; give both forms the same short set.
- **Sideways photos.** Cards and the original view apply CSS `rotate` to the image (`recipe-card.tsx`, `recipe-view.tsx`, the book leaf). A 90° card often clips inside `object-cover` or leaves an empty frame. Rotate so the whole card is visible, letterboxed if needed.
- **“I made this” cannot be undone.** The button on the card and the end of cook mode both call `logCook`, which only increments. A slip of the thumb dog-ears a card she didn’t cook. A few seconds of “Undo” is enough.
- **Waiting and pending.** A photo “not read yet” explains nothing about what she should do next.

---

## Quick wins vs larger changes

### Quick wins

These are local, and they do not require a new visual language. They are the difference between “fussy on the iPad” and “I can use this at the counter”.

1. Drop `orientation: "portrait"`. At tablet widths, raise the `max-w-lg` cap so the card and the cook screen use the iPad (finding 1). Even a single wider column helps before any redesign.
2. Sticky “Start cooking” under the title; pass the scale into cook mode; leave cook mode without pushing a history entry that traps Back (finding 3).
3. “Correct this card” and “Throw this card out”, using the review line editor and the existing `deleteRecipe` (finding 2). Show description and tags at review time so they are not filed blind.
4. 48px on chips, scale, tags, box toggles, and add-line. Larger tab labels (finding 10).
5. Visible, removable filters, and an empty state that tells the truth (finding 6). Include category and source in search; don’t autofocus search on iPad (finding 5).
6. One book picker, not two (finding 11). Stop auto-creating a box from a free-typed category, or ask first (finding 2).
7. Failed photo: retry and discard. Sticky save on review. Zoom that doesn’t close when she touches the picture (finding 7).
8. iPad install sentence. Share intro that matches “let them add”. In-page confirm instead of `window.confirm` for clearing the week (findings 10 and 12).

### Larger redesigns

Do these after the quick wins, and judge them with the brand guide’s one-line test.

1. **One box, not two apps.** Retire the split between the Recipes grid and the Box shelf. Dividers plus a card you turn, search on the same screen, A–Z there too (finding 4). The photo grid can remain a peek of a divider (“12 cards”), not the home.
2. **iPad cook and iPad review as two-up layouts.** List and step together; photo and correction together (findings 3 and 7). This is the layout the portrait lock and the phone column are currently preventing.
3. **Let it look handled, not aligned.** Slight rotation on some cards only, index-card corners, the pink bar demoted on large screens, one handwriting face that doesn’t read as a template (finding 13). Do this after the structure is simple, or the decoration will sit on top of the rigidity.

What not to build while doing this: more metadata badges, a heart-style favorite beside Keeper, a second icon library, or a multi-column feed. Those are the things `BRAND.md` §2 and §8 say to cut.

---

## Wireframe notes for the top three

### 1. The iPad is the open box

Phone stays a single column: wordmark, the divider tabs, one card wide, Add as the one strong button.

On the iPad, landscape, no pink bar across the top. Cream page. At the left, a narrow stack of divider tabs in the handwriting (Mains, Baking, Holidays, Not filed yet), each with a count, the current one a real tab like a box divider — not a pill. The rest of the screen is one index card, large enough to read at arm’s length: title, the short note, ingredients, steps. Bottom of the card: Previous, the section name, Next. Search is a single line above the card, quiet until she taps it. The tab bar, if it remains, has three items with labels she can read, centered under the card rather than stretched across the bezel.

Portrait iPad is the same card, dividers across the top in two wrapping rows so nothing hides past a scroll.

### 2. Finding a card is one gesture

She opens the app on the box, not on a grid. The first divider can be Everything, A–Z. Swipe the card, or tap Next. A keeper shows the ribbon; she does not have to change tabs to see that.

When she wants the chicken one, she taps search and types. The card in front filters; she does not leave for another tab. If nothing matches, the card says so and offers to clear the word.

Want to try, Keepers, and Best loved are not a second shelf. They are a small mark she can turn on from the card, and a divider she can open if she wants only those. Custom piles (“what the kids will eat”) live in that same divider list, at the bottom, with “New divider”.

### 3. Correct it, then cook from it

From the card, “Correct this card” opens the photo on the left of the iPad and the lines on the right. The photo stays while she scrolls the ingredients. Save sits at the bottom of the text column and does not require a hunt. Throw out is a text button under the note, then a panel: “Throw out Grandma’s pot roast? The photo goes too.”

“Start cooking” is on the card immediately under the title, and again as the split screen: left, the list with 48px rows and ½ / 1 / 2 / 3 plus “we’re 6”; right, “Step 2 of 9” in the large type cook mode already uses. Next is the wide pink button. Done returns to the card she came from. Back does not reopen cook mode.

On the phone, the same screens stack: photo, then lines; list behind an Ingredients button that does not forget her checks; Next fixed to the bottom above the home indicator.
