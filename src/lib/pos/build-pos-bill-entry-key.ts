/**
 * Canonical POS bill identity for Instant `canonical_bill_id` / `entry_key`.
 * Must match across POS sync upsert and member claim flows.
 */
export function buildPosBillEntryKey(params: {
  posBillId: string;
  restaurantId: string;
}): string {
  const normalizedRestaurantId = params.restaurantId.trim().toUpperCase();
  return `pos-bill:${normalizedRestaurantId}:${params.posBillId}`;
}
