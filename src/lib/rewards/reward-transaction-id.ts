import { sha256Hex } from '@/src/lib/crypto/web-crypto';

export async function buildRewardTransactionId(
  reference: string
): Promise<string> {
  const normalized = reference.trim();
  const digest = await sha256Hex(normalized);
  return `reward-bill-${digest}`;
}
