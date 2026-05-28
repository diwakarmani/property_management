/**
 * Formats a numeric price as a USD string.
 *   ≥ 1,000,000  → $1.2M
 *   ≥ 1,000      → $500K
 *   < 1,000      → $800
 */
export const formatPrice = (price: number): string => {
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `$${(price / 1_000).toFixed(0)}K`;
  return `$${price.toLocaleString('en-US')}`;
};
