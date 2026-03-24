export const staffRoles = {
  manager: 'manager',
  staff: 'staff',
} as const;

export type StaffRole = (typeof staffRoles)[keyof typeof staffRoles];

export const loyaltyTransactionSources = {
  manualStaffEntry: 'manual_staff_entry',
  posImport: 'pos_import',
} as const;

export type LoyaltyTransactionSource =
  (typeof loyaltyTransactionSources)[keyof typeof loyaltyTransactionSources];

export const loyaltyTransactionStatuses = {
  posted: 'posted',
  rejected: 'rejected',
} as const;

export type LoyaltyTransactionStatus =
  (typeof loyaltyTransactionStatuses)[keyof typeof loyaltyTransactionStatuses];

export const loyaltyConfig = {
  approvalCapVnd: 3_000_000,
  currency: 'VND',
  pointsAwardedPerStep: 10,
  spendStepVnd: 100_000,
  version: 'v1',
} as const;

/** QR payload versions accepted by `parseMemberQrValue` (`esco:member:<version>:...`). */
export const SUPPORTED_MEMBER_QR_VERSIONS = ['v1'] as const;

export type MemberQrPayload = {
  memberId: string;
  version: (typeof SUPPORTED_MEMBER_QR_VERSIONS)[number];
};

export function buildMemberQrValue(memberId: string): string {
  const trimmedMemberId = memberId.trim();
  if (!trimmedMemberId) return '';
  return `esco:member:${loyaltyConfig.version}:${trimmedMemberId}`;
}

export function parseMemberQrValue(value: string): MemberQrPayload | null {
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  const [prefix, kind, version, ...rest] = trimmedValue.split(':');
  if (prefix !== 'esco' || kind !== 'member' || !version) return null;

  const supportedVersion = SUPPORTED_MEMBER_QR_VERSIONS.find(
    (v) => v === version
  );
  if (supportedVersion === undefined) return null;

  const memberId = rest.join(':').trim();
  if (!memberId) return null;

  return {
    memberId,
    version: supportedVersion,
  };
}

export function calculatePointsForAmountVnd(amountVnd: number): number {
  if (!Number.isFinite(amountVnd) || amountVnd <= 0) return 0;
  const steps = Math.floor(amountVnd / loyaltyConfig.spendStepVnd);
  return steps * loyaltyConfig.pointsAwardedPerStep;
}

export function isStaffRole(
  value: string | null | undefined
): value is StaffRole {
  return value === staffRoles.staff || value === staffRoles.manager;
}

export function isManagerRole(value: string | null | undefined): boolean {
  return value === staffRoles.manager;
}

export function formatCurrencyVnd(amountVnd: number): string {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: loyaltyConfig.currency,
  }).format(amountVnd);
}
