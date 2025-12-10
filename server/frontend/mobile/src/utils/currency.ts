/**
 * Currency utility functions for Indian Rupees (INR) formatting
 * This ensures consistent currency display across the entire app
 */

/**
 * Format a number as Indian Rupees (INR)
 * @param amount - The amount to format
 * @param options - Optional formatting options
 * @returns Formatted currency string (e.g., "₹1,23,456")
 */
export const formatCurrencyINR = (
  amount: number | string | null | undefined,
  options: {
    showSymbol?: boolean;
    decimals?: number;
    compact?: boolean;
  } = {}
): string => {
  const {
    showSymbol = true,
    decimals = 0,
    compact = false
  } = options;

  // Handle null, undefined, or invalid values
  const numAmount = Number(amount) || 0;

  // Use Indian locale for proper number formatting
  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    notation: compact ? 'compact' : 'standard'
  });

  const formattedAmount = formatter.format(numAmount);
  
  return showSymbol ? `₹${formattedAmount}` : formattedAmount;
};

/**
 * Format currency for display in cards or small spaces
 * @param amount - The amount to format
 * @returns Compact formatted currency string
 */
export const formatCurrencyCompact = (amount: number | string | null | undefined): string => {
  return formatCurrencyINR(amount, { compact: true });
};

/**
 * Format currency with 2 decimal places for precise amounts
 * @param amount - The amount to format
 * @returns Formatted currency string with 2 decimal places
 */
export const formatCurrencyPrecise = (amount: number | string | null | undefined): string => {
  return formatCurrencyINR(amount, { decimals: 2 });
};

/**
 * Format currency without symbol (for calculations or when symbol is shown separately)
 * @param amount - The amount to format
 * @returns Formatted number string without currency symbol
 */
export const formatAmountOnly = (amount: number | string | null | undefined): string => {
  return formatCurrencyINR(amount, { showSymbol: false });
};

/**
 * Parse currency string back to number
 * @param currencyString - The currency string to parse (e.g., "₹1,23,456")
 * @returns Parsed number
 */
export const parseCurrencyINR = (currencyString: string): number => {
  if (!currencyString) return 0;
  
  // Remove currency symbol and commas
  const cleanString = currencyString.replace(/[₹,]/g, '');
  return Number(cleanString) || 0;
};

/**
 * Calculate percentage of budget used
 * @param used - Amount used
 * @param total - Total budget
 * @returns Percentage as number (0-100)
 */
export const calculateBudgetPercentage = (used: number, total: number): number => {
  if (total === 0) return 0;
  return Math.min((used / total) * 100, 100);
};

/**
 * Format budget progress text
 * @param used - Amount used
 * @param total - Total budget
 * @returns Formatted progress text
 */
export const formatBudgetProgress = (used: number, total: number): string => {
  const usedFormatted = formatCurrencyINR(used);
  const totalFormatted = formatCurrencyINR(total);
  const percentage = calculateBudgetPercentage(used, total);
  
  return `${usedFormatted} of ${totalFormatted} (${percentage.toFixed(1)}%)`;
};
