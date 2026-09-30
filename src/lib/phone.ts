/**
 * Kenyan mobile numbers as stored on staff_users.phone_number.
 *
 * People type 0712…, 712…, 254712… or +254712…
 * The API expects the international form: +254 then 9 digits.
 */
export function nationalKenyaDigits(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("254")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 9);
}

/** Spaces for the +254 field: 712 345 678 */
export function formatKenyaNational(input: string): string {
  const digits = nationalKenyaDigits(input);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

/** null if it is not a full Kenyan mobile yet */
export function toE164Kenya(input: string): string | null {
  const digits = nationalKenyaDigits(input);
  if (digits.length !== 9) return null;
  return `+254${digits}`;
}
