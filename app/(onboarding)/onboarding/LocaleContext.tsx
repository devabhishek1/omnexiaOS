'use client'

import React, { createContext, useContext } from 'react'
import { Locale, OnboardingStrings, TRANSLATIONS } from './translations'

const LocaleContext = createContext<OnboardingStrings>(TRANSLATIONS.en)

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <LocaleContext.Provider value={TRANSLATIONS[locale] ?? TRANSLATIONS.en}>
      {children}
    </LocaleContext.Provider>
  )
}

/** Consume within any onboarding step to get the correct translated strings. */
export function useT(): OnboardingStrings {
  return useContext(LocaleContext)
}
