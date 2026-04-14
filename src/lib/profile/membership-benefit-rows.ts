export function buildMembershipBenefitRows<T extends { wide: boolean }>(
  benefits: readonly T[]
): T[][] {
  const rows: T[][] = [];
  let pendingRow: T[] = [];

  for (const benefit of benefits) {
    if (benefit.wide) {
      if (pendingRow.length > 0) {
        rows.push(pendingRow);
        pendingRow = [];
      }

      rows.push([benefit]);
      continue;
    }

    pendingRow.push(benefit);

    if (pendingRow.length === 2) {
      rows.push(pendingRow);
      pendingRow = [];
    }
  }

  if (pendingRow.length > 0) rows.push(pendingRow);

  return rows;
}
