const ALLOWED_PENDING_DELETION_PATHS = [
  '/privacy',
  '/profile/delete-account',
  '/support',
  '/terms',
] as const;

function normalizePathname(pathname: string | null | undefined): string {
  if (!pathname) return '/';
  if (pathname === '/') return '/';
  return pathname.replace(/\/+$/, '');
}

export function isAllowedPendingDeletionPath(
  pathname: string | null | undefined
): boolean {
  const normalizedPathname = normalizePathname(pathname);

  return ALLOWED_PENDING_DELETION_PATHS.some((allowedPath) => {
    return (
      normalizedPathname === allowedPath ||
      normalizedPathname.startsWith(`${allowedPath}/`)
    );
  });
}
