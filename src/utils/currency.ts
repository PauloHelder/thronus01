/**
 * Centralized currency formatter for Angolan Kwanza (Kz).
 * Always displays as "Kz 1.000,00" — never "AOA".
 */
export const formatKz = (value: number, opts?: { decimals?: boolean }): string => {
  const decimals = opts?.decimals !== false; // default: show decimals
  const formatted = new Intl.NumberFormat('pt-AO', {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(value);
  return `Kz ${formatted}`;
};
