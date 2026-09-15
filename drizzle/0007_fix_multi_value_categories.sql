-- Custom SQL migration file, put your code below! --

-- Some imported recipes ended up with every category a site listed jammed
-- into one comma-separated string (e.g. "Appetizer, Brunch, Dinner, Lunch,
-- Main Course, Salad, Side Dish"), instead of the single category this
-- column is meant to hold. That made the category filter chips on /recipes
-- render one unusable run-on pill per offending recipe. Trim each of those
-- down to just the first category, matching how new imports are parsed now.
UPDATE "pinkbox"."recipes"
SET "category" = trim(split_part("category", ',', 1))
WHERE "category" LIKE '%,%';
