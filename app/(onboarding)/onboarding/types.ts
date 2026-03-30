export type OnboardingData = {
  locale: string
  businessName: string
  logoFile?: File
  countryCode: string
  vatRate?: number
  currency?: string
  dateFormat?: string
  vatNumberHint?: string
  industry?: string
  companySize?: string
  gmailConnected: boolean
  gmailEmail?: string
  activeModules: string[]
  invitedEmails: string[]
}
