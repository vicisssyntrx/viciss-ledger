/**
 * Indian Rupee (INR) Currency and Decimal-Safe Formatting Utilities
 * 
 * Rules:
 * - All financial numbers are calculated in integer paise (1 Rupee = 100 paise).
 * - Floating point arithmetic is never used for balance accumulation or sums.
 * - Formatted using Indian numbering grouping: 1,25,000.00 (Lakhs, Crores).
 */

/**
 * Converts integer paise to Indian Rupee formatted string with ₹ symbol.
 * Example: 12500000 paise -> ₹1,25,000.00
 */
export function formatINR(
  paise: number,
  options?: {
    showSign?: boolean;
    showSymbol?: boolean;
    absolute?: boolean;
  }
): string {
  const { showSign = false, showSymbol = true, absolute = false } = options || {};

  const isNegative = paise < 0;
  const absPaise = Math.abs(Math.round(paise));
  const rupeesPart = Math.floor(absPaise / 100);
  const paisePart = absPaise % 100;

  // Format the rupeesPart according to the Indian Numbering System
  // Last 3 digits grouped, then groups of 2 digits
  const rupeeString = rupeesPart.toString();
  let formattedRupees = '';

  if (rupeeString.length <= 3) {
    formattedRupees = rupeeString;
  } else {
    const lastThree = rupeeString.substring(rupeeString.length - 3);
    const otherNumbers = rupeeString.substring(0, rupeeString.length - 3);
    // Insert commas every 2 digits in otherNumbers from right to left
    const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formattedRupees = `${formattedOthers},${lastThree}`;
  }

  const formattedDecimal = paisePart.toString().padStart(2, '0');
  const numericString = `${formattedRupees}.${formattedDecimal}`;

  const symbol = showSymbol ? '₹' : '';
  
  if (absolute) {
    return `${symbol}${numericString}`;
  }

  if (isNegative) {
    return `- ${symbol}${numericString}`;
  }

  if (showSign && paise > 0) {
    return `+ ${symbol}${numericString}`;
  }

  return `${symbol}${numericString}`;
}

/**
 * Converts rupees (number or string representation) safely to integer paise.
 * Handles inputs like "1,25,000.50", "₹500", 500.25, etc.
 */
export function rupeesToPaise(input: number | string): number {
  if (typeof input === 'number') {
    if (isNaN(input)) return 0;
    // Using string rounding to avoid IEEE 754 precision issues like 1.15 * 100 = 114.99999999999999
    return Math.round(input * 100);
  }

  if (typeof input !== 'string') return 0;

  // Clean string: remove currency symbols, spaces, commas
  const cleaned = input.replace(/[₹$,\s]/g, '').trim();
  if (!cleaned) return 0;

  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;

  // Handle decimal string components accurately
  const parts = cleaned.split('.');
  const wholePart = parseInt(parts[0] || '0', 10);
  let decimalPart = 0;
  if (parts.length > 1) {
    const decStr = (parts[1] || '').substring(0, 2).padEnd(2, '0');
    decimalPart = parseInt(decStr, 10);
  }

  const sign = cleaned.startsWith('-') ? -1 : 1;
  const absPaise = Math.abs(wholePart) * 100 + decimalPart;
  return sign * absPaise;
}

/**
 * Converts integer paise to standard decimal number in rupees (for UI display or calculations).
 */
export function paiseToRupees(paise: number): number {
  return Math.round(paise) / 100;
}
