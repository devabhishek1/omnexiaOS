// EU VAT rates by country code (standard rates, 2026)
export const EU_VAT_RATES: Record<string, number> = {
  AT: 20, // Austria
  BE: 21, // Belgium
  BG: 20, // Bulgaria
  CY: 19, // Cyprus
  CZ: 21, // Czech Republic
  DE: 19, // Germany
  DK: 25, // Denmark
  EE: 22, // Estonia
  ES: 21, // Spain
  FI: 25.5, // Finland
  FR: 20, // France
  GR: 24, // Greece
  HR: 25, // Croatia
  HU: 27, // Hungary
  IE: 23, // Ireland
  IT: 22, // Italy
  LT: 21, // Lithuania
  LU: 17, // Luxembourg
  LV: 21, // Latvia
  MT: 18, // Malta
  NL: 21, // Netherlands
  PL: 23, // Poland
  PT: 23, // Portugal
  RO: 19, // Romania
  SE: 25, // Sweden
  SI: 22, // Slovenia
  SK: 20, // Slovakia
  // Non-EU but common
  GB: 20, // United Kingdom
  NO: 25, // Norway
  CH: 8.1, // Switzerland
}

export function getVatRate(countryCode: string): number {
  return EU_VAT_RATES[countryCode?.toUpperCase()] ?? 20
}

export function calculateVat(subtotal: number, vatRate: number) {
  const vatAmount = (subtotal * vatRate) / 100
  return {
    subtotal,
    vatRate,
    vatAmount: Math.round(vatAmount * 100) / 100,
    total: Math.round((subtotal + vatAmount) * 100) / 100,
  }
}
