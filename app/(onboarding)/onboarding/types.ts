export type OnboardingData = {
  locale: string
  businessName: string
  logoFile?: File
  countryCode: string
  industry?: string
  companySize?: string
  gmailConnected: boolean
  activeModules: string[]
  invitedEmails: string[]
}
