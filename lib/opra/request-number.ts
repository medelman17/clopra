/**
 * Generate a unique request number for OPRA requests
 * Format: OPRA-YYYY-MMDD-XXXX
 * Where XXXX is a random 4-digit number
 */
export function generateRequestNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  
  return `OPRA-${year}-${month}${day}-${random}`;
}