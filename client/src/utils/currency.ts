/**
 * Currency utility functions for Indian Rupee (INR)
 * All internal calculations handle money as integers in paise (1 Rupee = 100 paise).
 */

/**
 * Formats a paise value into standard Indian currency format (INR).
 * e.g., 123456 paise -> "₹1,234.56"
 * e.g., 10000000 paise -> "₹1,00,000.00"
 */
export const formatINR = (paise: number, includeSign = true): string => {
  const rupees = paise / 100;
  
  // Format based on Indian numbering system (Lakh, Crore)
  // e.g. 100000 -> 1,00,000.00
  const parts = rupees.toFixed(2).split('.');
  let lastThree = parts[0].substring(parts[0].length - 3);
  const otherParts = parts[0].substring(0, parts[0].length - 3);
  
  if (otherParts !== '') {
    lastThree = ',' + lastThree;
  }
  
  const formattedInt = otherParts.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  const result = `${formattedInt}.${parts[1]}`;
  
  return includeSign ? `₹${result}` : result;
};

/**
 * Compact formats an INR paise amount.
 * e.g., 120000000 paise (₹1,20,000) -> "₹1.2L"
 * e.g., 1000000000 paise (₹1,00,00,000) -> "₹1Cr"
 */
export const formatCompact = (paise: number): string => {
  const rupees = paise / 100;
  
  if (rupees >= 10000000) {
    // 1 Crore = 1,00,00,000
    const cr = rupees / 10000000;
    return `₹${cr.toFixed(cr % 1 === 0 ? 0 : 1)}Cr`;
  }
  
  if (rupees >= 100000) {
    // 1 Lakh = 1,00,000
    const lakh = rupees / 100000;
    return `₹${lakh.toFixed(lakh % 1 === 0 ? 0 : 1)}L`;
  }
  
  if (rupees >= 1000) {
    const k = rupees / 1000;
    return `₹${k.toFixed(k % 1 === 0 ? 0 : 1)}k`;
  }
  
  return formatINR(paise);
};

/**
 * Parses a rupee formatted string back into integer paise.
 * e.g., "1,234.56" -> 123456
 */
export const parseCurrency = (text: string): number => {
  // Strip everything except digits and decimal point
  const clean = text.replace(/[^0-9.]/g, '');
  if (!clean) return 0;
  
  const parsed = parseFloat(clean);
  if (isNaN(parsed)) return 0;
  
  // Convert to paise as integer
  return Math.round(parsed * 100);
};

/**
 * Gets the transaction sign based on type
 * e.g., income -> "+", expense -> "-", transfer -> ""
 */
export const getSign = (type: 'income' | 'expense' | 'transfer'): string => {
  switch (type) {
    case 'income':
      return '+';
    case 'expense':
      return '-';
    case 'transfer':
      return '';
  }
};
