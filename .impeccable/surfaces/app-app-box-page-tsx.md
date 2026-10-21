---
version: 1
slug: "app-app-box-page-tsx"
primary_target: "app/(app)/box/page.tsx"
related_targets: ["components/recipe-view.tsx","app/(app)/layout.tsx"]
---

# The box (front door) — surface brief

Scope: `/box` (the front door), the recipe card `/r/[id]`, and the signed-in shell (`app/(app)/layout.tsx`, header, tab bar). Mode: Operate. Chosen structure: "Cards you can see" (seed round, option `card-wall`).

Audience and job: everyone in the household, on a phone one-handed or an iPad at the counter; find a recipe fast and start cooking, or put a card in. Must remain untouched: cook mode (liked), capture/review flows, data model, sharing rules, the pink-box world (pinned by the user). What would make a polished result feel wrong: a recipe feed that looks like Pinterest, a dashboard of filters before any food, anything that needs explaining.

## Direction contract

THESIS: Open the app and the recipes are already in front of you as cards you recognise by sight, the way a lid comes off a box. Refuses the category default of a menu of collections (filters, shelves, tins) standing between the person and the food.

OWN-WORLD: Box pink (#c2566f) as fill for the one primary action and the Keeper ribbon; card cream and page cream as paper; browned ink for the hand; Caveat for every title and margin note, Source Serif for everything read. Index cards with 3px corners, faint blue-grey rule, slight per-card tilt, dog-ear on cooked cards, splatter with use. Divider tabs shaped like the tabbed dividers inside the box. No pink bar across the top; the wordmark sits on the paper.

STORY: She sees her own cards and taps the one she wants. Dividers narrow by what she already calls things (Mains, Sides, Desserts, Keepers). Search is one line on the same screen, filtering in place. A card opens like an index card with one obvious Start cooking.

FIRST VIEWPORT: Wordmark top-left in pink hand, Settings top-right. One search line. A wrapping row of divider tabs, Everything selected, sitting on the top edge of the wall. The wall: two across on a phone, three to four on an iPad, each card a photo on top (or a ruled card face with the title in the hand) and the title beneath, Keeper ribbon on the top edge. Tab bar: Box, camera (primary), Plan.

FORM: Photo-forward card wall; position 4 on the ordered structural list, dealt as lead. seed:0f39acc7ce729bab

Signature interaction: tapping a divider re-deals the wall in place (no navigation), the chosen tab lifting to sit on the wall's edge; search narrows the same wall as you type.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- Whether "Best loved" / "Not in a box" need to exist as dividers (dropped from the front door; routes remain).
- Serving-count scaling beyond ½/1/2/3 (not in this round).
