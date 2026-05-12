/**
 * Centralized currency formatter for Angolan Kwanza (AOA).
 * Always displays as "AOA 1.000,00"
 */
export const formatAOA = (value: number, opts?: { decimals?: boolean }): string => {
  const decimals = opts?.decimals !== false; // default: show decimals
  const formatted = new Intl.NumberFormat('pt-AO', {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(value);
  return `AOA ${formatted}`;
};
