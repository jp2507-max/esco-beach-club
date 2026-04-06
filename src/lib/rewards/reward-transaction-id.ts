import { createHash } from 'node:crypto';

export function buildRewardTransactionId(reference: string): string {
  const normalized = reference.trim();
  const digest = createHash('sha256').update(normalized, 'utf8').digest('hex');
  return `reward-bill-${digest}`;
}
