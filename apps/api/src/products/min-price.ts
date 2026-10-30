type PricedVariant = { price: number; isActive: boolean };

/**
 * Value of the denormalized Product.minPrice (SPEC 7.4): the lowest price among active variants,
 * or null when the product has none. Out-of-stock variants still count — they are listed, just
 * not purchasable.
 */
export function computeMinPrice(variants: readonly PricedVariant[]): number | null {
  const prices = variants.filter((variant) => variant.isActive).map((variant) => variant.price);
  return prices.length > 0 ? Math.min(...prices) : null;
}
