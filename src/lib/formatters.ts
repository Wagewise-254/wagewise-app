// src/lib/formatters.ts

/**
 * Formats a number into a compact "K" (thousands), "M" (millions) representation.
 * e.g., 12345 => 12.3K, 1234567 => 1.23M
 * @param num The number to format.
 * @param digits The number of decimal places for the compact number.
 * @returns A string representing the formatted number.
 */
export const formatCurrencyToCompact = (num: number, digits: number = 1): string => {
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "K" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "B" }, // Billion, if needed
    // Add more if necessary
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  const item = lookup.slice().reverse().find(item => num >= item.value);
  if (item && item.value > 1) { // Only apply K, M, B for numbers >= 1000
    return (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol;
  }
  return num.toFixed(2); // Default to 2 decimal places if not compacting
};

/**
 * Formats a number as KSh currency.
 * @param amount The number to format.
 * @returns A string representing the formatted currency, e.g., "KSh 1,234.56".
 */
export const formatToKsh = (amount: number | string | undefined | null): string => {
    if (amount === undefined || amount === null) return 'KSh 0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return 'KSh 0.00';
    return `KSh ${num.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Formats a number into a compact KSh currency representation.
 * e.g., 12345 => KSh 12.3K
 * @param num The number to format.
 * @param digits The number of decimal places for the compact number.
 * @returns A string representing the formatted compact currency.
 */
export const formatKshCompact = (num: number | string | undefined | null, digits: number = 1): string => {
    if (num === undefined || num === null) return 'KSh 0';
    const numericValue = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(numericValue)) return 'KSh 0';

    if (Math.abs(numericValue) < 1000) {
        return `KSh ${numericValue.toFixed(0)}`; // No decimals for less than 1K, or use 2 if preferred
    }

    const lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "K" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "B" },
    ];
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    const item = lookup.slice().reverse().find(item => Math.abs(numericValue) >= item.value);

    if (item && item.symbol) { // Check if a symbol (K, M, B) is found
        return `KSh ${(numericValue / item.value).toFixed(digits).replace(rx, "$1")}${item.symbol}`;
    }
    return `KSh ${numericValue.toFixed(0)}`; // Fallback for numbers that don't get a K, M, B
};

export const getStatusBadgeClass = (status: string): string => {
    switch (status) {
        case 'Initiated':
        case 'Calculating':
            return 'bg-blue-100 text-blue-700 border-blue-300';
        case 'Calculation_Complete':
            return 'bg-yellow-100 text-yellow-700 border-yellow-300'; // Indicates awaiting next step
        case 'Sending_Payslips':
            return 'bg-indigo-100 text-indigo-700 border-indigo-300';
        case 'Payslips_Sent':
        case 'Paid': // Assuming 'Paid' is also a success state
            return 'bg-green-100 text-green-700 border-green-300';
        case 'Processing_Failed':
        case 'Calculation_Failed':
        case 'Failed':
            return 'bg-red-100 text-red-700 border-red-300';
        case 'Payslip_Sending_Failed':
            return 'bg-orange-100 text-orange-700 border-orange-300';
        case 'Draft':
            return 'bg-gray-100 text-gray-700 border-gray-300';
        default:
            return 'bg-gray-100 text-gray-500 border-gray-300';
    }
};