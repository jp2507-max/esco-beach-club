type ScanLockRef = {
  current: boolean;
};

export function tryAcquireScanLock(lockRef: ScanLockRef): boolean {
  if (lockRef.current) return false;

  lockRef.current = true;
  return true;
}
