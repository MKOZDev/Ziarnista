-- Product images: the bucket key instead of a full URL, required alt text and pixel size.
-- Hand-edited: Prisma generates DROP COLUMN "url" + ADD COLUMN "storage_key", which would lose
-- data; RENAME keeps it. The CHECK constraints are not expressible in the Prisma schema.

-- AlterTable
ALTER TABLE "product_images" RENAME COLUMN "url" TO "storage_key";

-- No defaults: every row comes from an upload that knows the size. The table is empty when
-- this runs (images could not be uploaded before this migration).
ALTER TABLE "product_images"
ADD COLUMN     "width" INTEGER NOT NULL,
ADD COLUMN     "height" INTEGER NOT NULL,
ALTER COLUMN "alt" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "product_images_storage_key_key" ON "product_images"("storage_key");

-- Alt text is required for accessibility (same rule as the Zod schema)
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_alt_check" CHECK (btrim("alt") <> '');
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_size_check"
    CHECK ("width" > 0 AND "height" > 0);
