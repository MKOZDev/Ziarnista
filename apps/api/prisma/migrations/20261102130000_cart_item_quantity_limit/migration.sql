-- Cart quantity limit (same rule as the Zod schema in packages/shared): at most 99 of one
-- variant per cart. The lower bound (> 0) exists since the init migration.
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_quantity_max_check" CHECK ("quantity" <= 99);
