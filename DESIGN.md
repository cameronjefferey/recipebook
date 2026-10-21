---
name: The Pink Recipe Box
description: A worn pink tin of handwritten index cards, opened on a kitchen counter.
colors:
  page: "#fdf6ea"
  card: "#fffcf6"
  sink: "#f6ead8"
  pink: "#c2566f"
  pink-mid: "#e8909f"
  pink-soft: "#fadfe4"
  pink-deep: "#a8415a"
  box-rim: "#dba6b0"
  butter: "#f0c264"
  browned: "#8a6242"
  jam: "#a8322f"
  ink: "#382a22"
  muted: "#6f5a4b"
  line: "#382a2218"
  rule: "#5c6b7a3d"
typography:
  wordmark:
    fontFamily: "Caveat, cursive"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1
  display:
    fontFamily: "Caveat, cursive"
    fontSize: "clamp(2.1rem, 1.6rem + 1.5vw, 2.6rem)"
    fontWeight: 700
    lineHeight: 1.1
  headline:
    fontFamily: "Caveat, cursive"
    fontSize: "1.35rem"
    fontWeight: 700
    lineHeight: 1
  title:
    fontFamily: "Caveat, cursive"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1.05rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.25
  hand:
    fontFamily: "Caveat, cursive"
    fontSize: "1.25em"
    fontWeight: 400
    lineHeight: 1.3
  note:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "0.82rem"
    fontWeight: 400
    lineHeight: 1.375
rounded:
  paper: "3px"
  tab: "7px"
  field: "0.75rem"
  card: "12px"
  pill: "9999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.pink}"
    textColor: "{colors.page}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 1.5rem"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 1.5rem"
    height: "48px"
  button-ghost:
    textColor: "{colors.browned}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 1.5rem"
    height: "48px"
  button-danger:
    backgroundColor: "{colors.jam}"
    textColor: "{colors.page}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 1.5rem"
    height: "48px"
  input:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "0 1rem"
    height: "48px"
  chip:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 1rem"
    height: "48px"
  chip-selected:
    backgroundColor: "{colors.pink-deep}"
    textColor: "{colors.page}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 1rem"
    height: "48px"
  chip-new:
    textColor: "{colors.pink-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 1rem"
    height: "48px"
  divider-tab:
    backgroundColor: "{colors.sink}"
    textColor: "{colors.browned}"
    typography: "{typography.headline}"
    rounded: "{rounded.tab}"
    padding: "0.35rem 0.95rem 0.45rem"
    height: "48px"
  divider-tab-selected:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
    rounded: "{rounded.tab}"
    padding: "0.35rem 0.95rem 0.45rem"
    height: "48px"
  index-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.paper}"
    padding: "0.625rem 0.75rem 0.75rem"
  tab-bar-primary:
    backgroundColor: "{colors.pink}"
    textColor: "{colors.page}"
    rounded: "{rounded.pill}"
    size: "48px"
  hand-heading:
    textColor: "{colors.browned}"
    typography: "{typography.headline}"
    padding: "0 0 0.5rem"
---

# Design System: The Pink Recipe Box

## Overview

**Creative North Star: "The Lid Comes Off"**

Open the app and the recipes are already in front of you, as cards you recognise by sight. Everything in this system is a part of one physical object, a sun-faded pink recipe tin and the handwritten index cards inside it, and nothing is allowed to be a part of a website instead. The page is the counter the tin sits on, in flour cream. The cards are a whiter paper with faint printed rules. The pink is the tin itself, and it appears only where the tin would: the lid, a fabric bookmark, the one button that matters. A warm cocoa ink does all the writing.

Density is generous because this is used one-handed on a phone or at arm's length on an iPad, often with wet fingers and without reading glasses: 17px root type, a 48px floor on everything that can be tapped, two cards across on a phone. Imperfection is a feature, not a flourish. Cards sit at a slight lean that never resolves to zero; a cooked card picks up a folded corner and faint butter and jam marks that build with use and then level off. The rules of the paper are the one cool colour in the whole palette and they are only ever one pixel thick.

Two voices do all the type. Caveat, bold, is the hand that wrote every title, every divider, every heading and margin note. Source Serif is everything that is read: ingredients, steps, labels on buttons. There is no sans, no mono, no kicker, no badge row of metadata above a title.

**Key Characteristics:**
- Paper, not panels: cream on cream, 3px corners, printed rules, tonal paper-edge shadows
- One pink, used as the tin would show it: a lid, a bookmark, a primary action
- Caveat for the hand, Source Serif for the read; no third face
- Counter-scale ergonomics: 17px root, 48px tap floor, large pill buttons
- Wear as a record: tilt, dog-ear, splatter, cook count, Keeper ribbon
- The wall re-deals in place; narrowing never navigates away

## Colors

A faded pink tin on a cream counter, written on in cocoa: three or four colours plus paper, with one cool pencil-rule allowed.

### Primary
- **Box Pink** (`pink`): the tin's own colour. Fill for the header bar (the lid of the box, with the name written on it), the primary pill button, the camera tab, the Keeper ribbon, and the tins' lid and front. `accent-color` for native controls. Never a page background or a card border.
- **Pink Ink** (`pink-deep`): the same pink deepened so it reads as ink at small sizes on the paper. Wordmark-adjacent text, active tab and back-link text, selected chip fill, the focus ring, the caret, the step numbers on a recipe card.
- **Faded Pink** (`pink-mid`): the lid's highlight, category stand-in icons on photo-less cards, the unchecked ingredient tick border, and the dashed border of a "New divider" chip.
- **Pink Wash** (`pink-soft`): a tinted paper. The scale-factor pill track, the tag chips under "Also under", and `::selection`.
- **Tin Rim** (`box-rim`): the 1px rim that holds the divider wall and the selected divider tab.

### Secondary
- **Browned Butter** (`browned`): warm cocoa-brown for everything written in the hand: hand headings, divider-tab text at rest, margin notes, ghost buttons, form labels. Also tints the dog-ear fold and the splatter.
- **Jam** (`jam`): the only red. Danger buttons, error notes (at 10% as a wash), the "remove" link in the plan, and the darker splatter marks.
- **Butter** (`butter`): the lightest splatter mark only. Never a fill or a text colour.

### Neutral
- **Counter Cream** (`page`): the page background and the divider wall; also the text colour on any pink fill.
- **Card Paper** (`card`): index cards, sheets, inputs on the wall, the tab bar (at 95% over a blur), secondary buttons and unselected chips.
- **Sink** (`sink`): the recessed warm tone. Divider tabs at rest, the note aside on a recipe, the image well behind a photo, the paper-edge offset shadow.
- **Cocoa Ink** (`ink`): all body text. Never pure black.
- **Pencil** (`muted`): secondary text (card notes, facts lines, placeholder at 60–80%), tab-bar labels at rest. Dark enough for 6:1 on the paper.
- **Pencil Line** (`line`): ink at 9% alpha. Every hairline border: cards, inputs, chips, the tab-bar top edge, section dividers on the back of a card.
- **Printed Rule** (`rule`): blue-grey at 24% alpha. The one cool note. The ruled lines on an index card and the `.ruled` underline beneath a title or section heading.

### Named Rules
**The Tin Rule.** Box Pink fills only what the tin itself would be: the lid across the top of the screen (the header bar), the primary action, the camera tab, the Keeper ribbon, the tins. It is never a page background or a card border.

**The Ink Rule.** Pink used as text or as a small selected fill is always `pink-deep`, never `pink`. The two are the same pink at two distances.

**The One Cool Note Rule.** The blue-grey `rule` is the only cool colour in the system and it appears only as a 1px line: card rules and the `.ruled` underline. Never as a fill, border, or text.

## Typography

**Display Font:** Caveat (with cursive fallback), always weight 700 for titles and headings
**Body Font:** Source Serif 4 (with Georgia, serif fallback), optical-size axis on
**Label/Mono Font:** none; UI labels are bold Source Serif

**Character:** One person's handwriting on typed cards. Caveat is set bold everywhere a title or heading appears, because at regular weight it reads as jotted next to the serif; at 700 it reads as written with confidence. Source Serif is the typed part of the card: plain, loose, large.

### Hierarchy
- **Wordmark** (Caveat 700, 1.75rem, line-height 1, `page` cream on the pink lid): "The Pink Recipe Box", top-left on the header bar, as if written on the box.
- **Display** (Caveat 700, 2.1rem on a phone rising to 2.6rem from 768px, line-height 1.1, balanced wrap): the recipe title on its card, with the `.ruled` underline. Empty-state titles use the same face at 1.9rem in `pink-deep`.
- **Headline** (Caveat 700, 1.35rem, line-height 1, `browned`): section names on and behind a card ("Ingredients", "Steps", "Filed under"). Also the divider tabs at 1.2rem.
- **Title** (Caveat 700, 1.25rem, line-height tight; 1.3rem on a 1.65rem rule when written directly on the lines): a recipe's name on its card on the wall.
- **Body** (Source Serif 400, 1.05–1.08rem, line-height 1.625, max 62ch): ingredients, steps, descriptions. Cook mode steps go to 1.6rem.
- **Label** (Source Serif 700, 0.9–1.15rem): button and chip text, tab-bar labels (0.9rem), the primary "Start cooking" at 1.15rem. Form labels only are 0.8rem uppercase with wide tracking in `browned`.
- **Hand** (Caveat 400, 1.25em of its context, line-height 1.3, `browned`): margin notes, card counts ("4 cards in the box"), "Make … the recipe", aisle names, figure captions. Deliberately regular weight: an aside, not a heading.
- **Note** (Source Serif 400, 0.82rem, `muted`): the single line under a card ("Mains · cooked 12×"); facts under a title at 0.95rem.

### Named Rules
**The One Hand Rule.** Every title, heading, divider, and margin note is Caveat. Headings are bold; asides are regular. No second handwriting face, ever.

**The Counter Rule.** Root type is 17px and nothing read mid-cook drops below 1.05rem. Inputs stay above the 16px iOS zoom threshold.

## Layout

The signed-in shell is exactly one screen tall (`h-dvh`) with the header and tab bar fixed and only the middle scrolling. Content sits in a centred column: 32rem wide on a phone, 45rem from 768px, 60rem from 1024px, with 1rem horizontal padding and 1rem vertical padding on the main column. Safe-area insets are respected on the header top and tab-bar bottom.

The front door stacks, with 0.75rem between blocks: one search line, the row of starred tins (when any are starred), a wrapping row of divider tabs, then the divider wall. The wall is a 2-column grid on a phone, 3 from 640px, 4 from 1024px, with 0.75rem column and 1rem row gaps, inset 0.25rem from the wall's rim; the wall itself is padded 0.9rem / 0.6rem / 0.75rem. The "Name a box" control sits under the wall as a dashed pill, not on it.

A recipe card is a single column on a phone, and from 768px splits ingredients and steps into a 1 : 1.5 two-column grid with a 2.5rem gutter. Readable text is capped at 62ch. The back of the card (status, filing, correcting) is separated from the front by 2rem and a `line` hairline.

Spacing rhythm follows Tailwind's rem scale at the 17px root: 0.5rem inside controls, 0.75rem between siblings, 1rem around blocks, 1.5rem between sections, 2rem between front and back of a card. Every interactive element clears 48 × 48px (`.tap`).

**The Re-deal Rule.** Choosing a divider or typing in search narrows the same wall in place and updates the address; it never navigates to a new screen.

## Elevation & Depth

Depth is paper on paper. Surfaces are tonally layered (counter cream → card paper, with sink for anything recessed) and shadows are faint and ink-tinted, never grey or black. The distinctive device is a one-to-three pixel offset shadow in sink or browned-sink that reads as the edge of the card beneath, not as a drop shadow. Pink fills that float (the primary pill, the camera tab) get a slightly larger soft shadow so they sit above the paper.

### Shadow Vocabulary
- **Paper** (`box-shadow: 0 1px 2px #382a2214, 1px 2px 0 0 color-mix(in srgb, var(--color-sink) 80%, var(--color-browned))`): an index card on the wall.
- **Sheet** (`box-shadow: 0 1px 3px #382a2214, 3px 3px 0 0 var(--color-sink)`): a form sheet (write a card, import a link): the card on top of a small stack.
- **Card sheet** (`box-shadow: 0 1px 3px #382a2214, 0 10px 24px -18px #382a2240`, from 768px only): the recipe read as one card lying on the counter.
- **Flat container** (`box-shadow: 0 1px 3px #382a2214`): the generic `Card` for settings, login, capture rows.
- **Lift** (`box-shadow: 0 2px 6px #382a2226` to `#382a2233`): the primary "Start cooking" pill and the camera tab.
- **Ribbon** (`box-shadow: 0 1px 2px #382a2233`): the Keeper bookmark.
- **Leaf** (`box-shadow: 0 1px 3px #382a2214, 4px 0 0 -1px var(--color-sink), 7px 0 0 -2px color-mix(in srgb, var(--color-sink) 65%, var(--color-browned))` plus a 12px gutter gradient): a page in the flip-through view.

### Named Rules
**The Card Beneath Rule.** Offset shadows are always paper-toned (`sink`, or sink mixed with `browned`) and never ink-toned or black. They stand for the card under this one, not for height.

**The Phone Is The Card Rule.** On a phone a recipe has no frame or shadow; the page is the card. The sheet treatment appears only from 768px.

## Shapes

Two form languages share the system and never mix on one element. Paper is nearly square: index cards, sheets, the note aside, the original-card thumbnail and figure all take a 3px corner, with a 1px `line` hairline and, on cards, a slight per-card rotation of ±0.6° or ±1.2° (never 0). Tools are pills: every button, chip, status toggle, order select and the camera tab are fully round (9999px). In between, inputs take a 0.75rem corner and the generic `Card` container 12px. Divider tabs are 7px-rounded on top only and square on the bottom when they join the wall; when the row wraps they close into 7px chips. The divider wall rounds 7px on three corners and stays square top-left where the first tab meets it. Ingredient ticks are 4px-cornered squares with a 2px border.

Three cut shapes belong to the paper: the Keeper ribbon (20 × 34px, pink, clipped to a swallow-tail at 78%), the dog-ear fold (26px, a 135° gradient from transparent to browned-sink, radius matched to the card) and the splatter (five radial marks in browned, jam and butter, opacity driven by cook count up to 0.5).

**The Paper Or Pill Rule.** Anything that is a card is 3px; anything that is pressed is a pill. Nothing is 8px-rounded-SaaS in between except an input (0.75rem) or a container `Card` (12px).

## Components

Tactile and plain. Buttons are big soft pills you could press with a knuckle; cards are paper you could pick up; chips toggle with the whole fill.

### Buttons
- **Shape:** fully round pill (9999px), 48px minimum height, 1.5rem horizontal padding, bold Source Serif at 1.1rem.
- **Primary:** box pink fill, counter-cream text, small shadow. "Start cooking" is the large case at 1.15rem with the lift shadow and `md:max-w-[20rem]`.
- **Secondary:** card paper fill, cocoa ink text, 1px `line` border ("I made this", "Correct this card", "Cancel").
- **Ghost:** no fill, `browned` text ("Flip through from here").
- **Danger:** jam fill, cream text.
- **Hover / Focus / Active:** no hover state; `active:brightness-95`; 2px `pink` outline offset 2px on focus-visible (the global ring is `pink-deep`). Disabled is 50% opacity.
- **Text links:** bold Source Serif in `pink-deep` with a chevron ("Back to the box", "Rename or share").

### Chips
- **Style:** pill, 48px tall, 1rem horizontal padding, bold 1rem Source Serif.
- **Unselected:** card paper fill, `line` border, ink text.
- **Selected:** `pink-deep` fill and border, cream text, optional 16px check icon. Used for status (Keeper / Want to try / Nope), "Filed under" boxes, and "Cook this week".
- **New:** no fill, 1px dashed `pink-mid` border, `pink-deep` text, leading plus icon ("New divider").
- **Tag:** `pink-soft` fill, `pink-deep` text, 0.95rem ("Also under").
- **Scale:** a `pink-soft` track with 44px round segments; the pressed one fills `pink-deep`.

### Cards / Containers
- **Index card (the wall):** 3px corners, card paper with a repeating `rule` line every 1.65rem, `line` hairline, paper shadow, ±0.6–1.2° rotation, `active:scale-[0.985]` over 200ms. Face is a 4:3 photo on a sink well, or the title written in the hand at 1.3rem on the rules with a `pink-mid` category icon bottom-right. Below, the title (if a photo) and a 0.82rem `muted` note. Keeper ribbon top-right; dog-ear fold bottom-right when cooked; splatter overlay scaled by cook count.
- **Card sheet (a recipe):** unframed on a phone; from 768px card paper, `line` border, 3px corners, card-sheet shadow, 1.75rem / 2.25rem padding. Keeper ribbon shows only at that width.
- **Sheet (a form):** card paper, `line` border, 3px, sheet shadow, 0.85rem / 1.05rem / 1.5rem padding.
- **Note aside:** sink fill, 3px, rotated −0.4°, `.hand` text at 1.15rem, right-indented 20% on tablet.
- **Card (generic container):** 12px corners, card paper, `line` border, flat shadow. Settings, login, capture rows only.

### Inputs / Fields
- **Style:** 0.75rem corners, 1px `line` border, counter-cream fill on a sheet (card paper when sitting on the page, as the search line does), 1rem horizontal padding, 48px tall, 1.05rem ink text, placeholder in `muted` at 60–80%.
- **Search:** leading 20px search icon in `muted`, `enterKeyHint="search"`, placeholder in the margin voice ("Chicken, or a name you remember").
- **Focus:** border becomes `pink`; outline removed; caret is `pink-deep`.
- **Error:** a `jam` 10% wash pill-ish block (0.75rem corners) with `jam` text, `role="alert"`.
- **Labels:** bold 0.8rem uppercase, wide tracking, `browned`; hint below in `muted` small.
- **Switch:** 48 × 28px pill, `line` off / `pink` on, 24px card-paper knob.

### Navigation
- **Header:** the pink lid. A `pink` bar with a faint ink shadow; wordmark in Caveat 700, 1.75rem, `page` cream, top-left; a 24px gear with "Settings" (label hidden below 640px) top-right in `page` at 85%, full `page` when current. Safe-area padding on top.
- **Divider tabs (`.divider-tabs`):** a wrapping, bottom-aligned row with 0.3rem gaps. Each tab is Caveat 700 1.2rem, 48px tall, 7px top corners, sink fill, `browned` text; the selected tab turns counter-cream with ink text and a 1px `box-rim` border, drops 1px to join the wall. A sub-count ("from Sam") is Source Serif 0.8rem `muted`. The row holds Everything, Keepers and Want to try, then the household's unstarred boxes: all of them up to six, otherwise the six fullest (A to Z) plus an "All N boxes" tab in `pink-deep` serif that unfolds an index panel inside the wall (sink field, every box as a pill chip with its count, grouped under hand-lettered initials from twelve boxes up). Typing in the search line narrows the row to boxes whose name matches, tinted `pink-soft`, alongside the matching cards; picking one of those clears the search. When the row wraps, every tab becomes a 7px chip and the wall gets a full rim; the joined look is drawn only when it can be true. Transitions: 160ms background, 220ms transform.
- **Divider wall (`.divider-wall`):** counter cream, 1px `box-rim`, 7px on three corners.
- **Tab bar:** card paper at 95% over a backdrop blur, `line` top hairline, safe-area bottom padding. Three stretch tabs with 28px stroke icons and bold 0.9rem labels, `muted` at rest and `pink-deep` when current. The centre "Add" tab is a 48px pink circle with a cream camera icon and the lift shadow.
- **Back:** a 24px chevron in `pink-deep` with an optional bold label, negative-margined to the column edge.

### Icons
All icons are inline SVG from `components/icons.tsx`: 24-unit viewBox, 1.8 stroke, round caps and joins, `currentColor`. Category stand-ins (pot, cupcake, salad, soup, bread…) are drawn in the same stroke and shown in `pink-mid` on photo-less cards. No icon font, no icon package.

### The Tin (`.box-card`)
A household box as an object: a 3D tin with a pink lid that hinges open (`rotateX(-108deg)` over 560ms on `cubic-bezier(0.18, 0.7, 0.2, 1)`) while five ruled index cards fan upward inside it. Reduced-motion disables the transitions. On the front door the tins stand in a wrapping row above the wall at 6.25rem wide (7.25rem from 640px, `.box-card--row`); tapping one lifts its lid and keeps it up while the wall re-deals to that box's cards, with a `pink-deep` ring on the open tin's front. Tapping it again closes it and the wall goes back to Everything. The favourite star sits on the lid's top-left corner in the row size. Only starred boxes are tins; everything else is a divider tab, so the counter never fills with tins. On the box's own page the tin is 9rem wide and a tap navigates after the lid lifts.

## Do's and Don'ts

### Do:
- **Do** write the wordmark on the pink lid in Caveat 700 at 1.75rem in `page` cream; the header bar is the one place pink spans the screen.
- **Do** give every index card a 3px corner, the printed `rule` lines, the paper shadow, and a non-zero tilt from the set ±0.6° / ±1.2°.
- **Do** set every title and heading in Caveat at weight 700, and every aside in `.hand` at regular weight in `browned`.
- **Do** keep all tap targets at or above 48 × 48px and all read text at or above 1.05rem.
- **Do** fill selected chips and small pink text with `pink-deep`, and reserve `pink` for the primary action, the camera tab, the ribbon and the tin.
- **Do** make offset shadows paper-toned (`sink`) so they read as the card beneath.
- **Do** narrow the wall in place when a divider or search changes, and keep the URL in step.
- **Do** record wear with the three marks that exist (ribbon, dog-ear, splatter) and nothing else.

### Don't:
- **Don't** add a sans-serif, a mono, or a second handwriting face. Two faces, total.
- **Don't** use `pink` as text on the paper; it falls short of contrast at small sizes. Use `pink-deep`.
- **Don't** introduce any cool colour beyond the 1px `rule` line. No blue, purple, teal, or sage anywhere.
- **Don't** use pure black, grey shadows, or 8px-rounded tiles for cards; paper is 3px and tools are pills.
- **Don't** put a kicker or eyebrow label above a title, or a row of metadata badges; facts go in one `muted` line below the title.
- **Don't** distress every card uniformly: splatter opacity is driven by cook count and caps at 0.5, and the dog-ear appears only once cooked.
- **Don't** draw the joined divider-tab treatment when the row has wrapped; close the tabs into chips instead.
- **Don't** render the Keeper ribbon or a card frame on a phone-width recipe; there the page is the card.
