/**
 * Format number to Indonesian Rupiah currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Parse Rupiah string back to number
 */
export function parseCurrency(value: string): number {
  return Number(value.replace(/[^0-9,-]+/g, '').replace(',', '.'));
}

/**
 * Format number with thousand separator (Indonesian style)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}
