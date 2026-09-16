# Brand Guide — The Pink Box

*A recipe website built around Mom's pink recipe box and her handwritten index cards.*

This document is the reference an AI agent (or any designer/developer) should follow when generating copy, layouts, or code for this site. The single test for every decision: **would this look and feel like it came out of that pink box, or like it came out of a template?** If it's the latter, redo it.

---

## 1. Core Idea

The whole site is a digital version of one specific, physical object: a worn pink recipe box full of index cards, built up over years. It is not "a recipe website with a vintage theme" — it *is* the box. Every screen should feel like an extension of opening that box and flipping through it.

- The homepage is the box itself.
- Categories are the tabbed dividers inside it.
- Individual recipes are index cards.
- Browsing the site should feel like flipping through cards, not scrolling a feed.

## 2. What This Is Not

To keep it from reading as AI-generated, actively avoid:

- Generic "vintage/rustic" stock elements — kraft-paper textures dropped onto a modern SaaS layout, cursive Google Fonts slapped on a Bootstrap grid.
- Perfect symmetry and evenly-spaced grids. Real index cards are slightly crooked, slightly different sizes, handled unevenly.
- Overly polished, backlit, styled food photography (the kind shot for a cookbook publisher). This is home food, photographed at home.
- Generic gradient backgrounds, glossy card shadows, or default emoji as icons.
- Filler stock photography of "families cooking" or unrelated smiling people.
- Corporate, upbeat marketing copy ("Discover delicious recipes today!"). Nothing here is being sold.

## 3. Voice & Tone

Write the way Mom would write on an index card, and the way the family would talk about her cooking — not the way a recipe blog writes.

- Plain, warm, a little imperfect. Short sentences. No SEO padding ("the secret to the perfect..."), no forced backstory paragraphs before every recipe.
- First person where it fits ("I always double the garlic"), occasional asides in the margin voice — a note added later, a substitution, a memory of who asked for this at Thanksgiving.
- Humor is dry and understated, never cutesy. No exclamation-point enthusiasm.
- It's fine — good, even — for entries to be uneven in length and formality, the way a real card collection is. Some recipes get a full story; some are just ingredients and steps.

## 4. Color Palette

Built from the actual object, not a "vintage palette" preset:

| Role | Color | Notes |
|---|---|---|
| Box pink | Dusty, slightly faded pink (not bubblegum, not millennial pink) | Primary brand color — think the pink of an actual old tin/plastic recipe box that's seen sun |
| Card cream | Warm off-white / aged paper | Card and page background |
| Ink | Soft near-black or dark brown | Body text — never pure #000 |
| Pencil grey | Muted grey | Secondary text, notes, timestamps |
| Recipe-card ruled line | Faint blue-grey | Used sparingly as a literal ruled line under headers, like index card lines |
| Accent (rare) | A single warm accent — tomato red, mustard, or sage — pulled from actual food, used only for small marks (a hand-drawn star, a "family favorite" flag) | Never as a large fill |

Avoid a big palette. Real recipe boxes are two or three colors plus paper. Resist the urge to add a modern SaaS accent color (electric blue, purple) anywhere.

## 5. Typography

- **Headers / recipe titles:** a handwriting-style typeface, but pick one with genuine imperfection and personality (uneven letterforms, real pen-like strokes) rather than a generic script font. It should look like *one person's* handwriting, consistently — like Mom's — not like a font sampler of "handwriting fonts."
- **Body copy (ingredients, steps):** a plain, highly readable typewriter or humanist serif — something that feels like it was typed on an actual typewriter or written in neat block print, not a modern geometric sans. Slightly imperfect over slick.
- Avoid mixing more than two typefaces total. Avoid anything that reads as a "designer template" font pairing (e.g., Playfair Display + Lato — extremely common, extremely recognizable as generic).
- Set body text a little looser than default web line-height — cards have room to breathe, not dense paragraphs.

## 6. Layout & UI Patterns

- **Card-based, not feed-based.** Each recipe is a literal card shape — index-card proportions, maybe a torn or slightly uneven edge, not a rounded-corner SaaS card with a drop shadow.
- **Tabbed dividers** for categories (Mains, Sides, Baking, Holidays, etc.), echoing the physical tabs inside the box.
- **Imperfection as a feature:** slight rotation on cards in a grid view, occasional handwritten margin notes, a coffee ring or worn corner used sparingly and tastefully (not on every card — real boxes aren't uniformly distressed).
- **Navigation should feel like flipping**, not scrolling through infinite content. Consider a literal "flip" or "next card" interaction for browsing sequentially, with search/filter for people who want to jump straight to something.
- Photography style: casual, real-kitchen photos — natural light, actual plates and counters, not styled food photography. A few "as it actually looks on the stove" shots beat one perfect hero shot.
- Icons, if used at all, should be simple hand-drawn-style marks (a small star, a check, a dog-ear) rather than a modern icon library (no Font Awesome/Material icons — they read as generic instantly).

## 7. Content Structure (per recipe)

Keep the structure close to what's actually on an index card, not a modern recipe-blog template:

1. Title (handwritten style)
2. A short note/story, optional, in the margin voice — who it's from, when it's made, what to remember
3. Ingredients — plain list
4. Steps — plain, numbered, no unnecessary sub-headers
5. Optional: a small handwritten-style annotation, like "Grandma's version used butter, not oil" or "double for the holidays"

No auto-generated "prep time / cook time / servings" badges unless Mom's actual cards had that info — don't add modern recipe-blog metadata that wasn't part of the source material.

## 8. One-Line Test for Any New Element

Before adding any visual or copy element, ask: **"Is this on the actual card, in the actual box, or is this something a recipe website usually has?"** If it's the latter, cut it.

---

*Next steps once this is agreed on: pick the specific handwriting and body typefaces, pull a couple of real photos of the box/cards to nail the exact pink and paper tones, and decide on the flip interaction for navigation.*
