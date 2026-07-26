export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateRequired(value: unknown, fieldName: string): string | null {
  if (value === null || value === undefined || value === "") {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateNumber(value: unknown, fieldName: string): string | null {
  if (isNaN(Number(value))) {
    return `${fieldName} must be a number`;
  }
  return null;
}
