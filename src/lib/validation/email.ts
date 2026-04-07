const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIN_EMAIL_LENGTH = 3;
const MAX_EMAIL_LENGTH = 254;

export function isEmailValid(email: string): boolean {
  const normalizedEmail = email.trim();
  if (
    normalizedEmail.length < MIN_EMAIL_LENGTH ||
    normalizedEmail.length > MAX_EMAIL_LENGTH
  ) {
    return false;
  }

  return EMAIL_PATTERN.test(normalizedEmail);
}
