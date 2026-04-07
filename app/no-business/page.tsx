'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'nl', label: 'Nederlands' },
]

const T = {
  en: {
    title: 'No active business',
    body: 'You are no longer a member of any business on Omnexia. Contact your employer if you believe this is a mistake.',
    signOut: 'Sign out',
  },
  fr: {
    title: "Aucune entreprise active",
    body: "Vous n'êtes plus membre d'aucune entreprise sur Omnexia. Contactez votre employeur si vous pensez qu'il s'agit d'une erreur.",
    signOut: 'Se déconnecter',
  },
  de: {
    title: 'Kein aktives Unternehmen',
    body: 'Sie sind kein Mitglied mehr eines Unternehmens auf Omnexia. Kontaktieren Sie Ihren Arbeitgeber, wenn Sie glauben, dass dies ein Fehler ist.',
    signOut: 'Abmelden',
  },
  es: {
    title: 'Ninguna empresa activa',
    body: 'Ya no eres miembro de ninguna empresa en Omnexia. Contacta a tu empleador si crees que esto es un error.',
    signOut: 'Cerrar sesión',
  },
  it: {
    title: 'Nessuna azienda attiva',
    body: 'Non sei più membro di nessuna azienda su Omnexia. Contatta il tuo datore di lavoro se pensi che si tratti di un errore.',
    signOut: 'Esci',
  },
  nl: {
    title: 'Geen actief bedrijf',
    body: 'Je bent geen lid meer van een bedrijf op Omnexia. Neem contact op met je werkgever als je denkt dat dit een fout is.',
    signOut: 'Uitloggen',
  },
}

type Locale = keyof typeof T

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem('omnexia_locale') as Locale | null
  if (stored && stored in T) return stored
  const browser = navigator.language.slice(0, 2) as Locale
  return browser in T ? browser : 'en'
}

export default function NoBusinessPage() {
  const router = useRouter()
  const [locale, setLocale] = useState<Locale>('en')

  useEffect(() => {
    setLocale(detectLocale())
  }, [])

  function changeLocale(l: Locale) {
    setLocale(l)
    localStorage.setItem('omnexia_locale', l)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const t = T[locale]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F6F6F1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E5E5E5', padding: '48px 40px', maxWidth: '440px', width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        {/* Language selector */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <select
            value={locale}
            onChange={e => changeLocale(e.target.value as Locale)}
            style={{ fontSize: '12px', padding: '4px 8px', border: '1px solid #E5E5E5', borderRadius: '6px', backgroundColor: '#F6F6F1', color: '#555', cursor: 'pointer', outline: 'none' }}
          >
            {LOCALES.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>

        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '24px' }}>
          ✕
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
          {t.title}
        </h1>
        <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6, margin: '0 0 32px' }}>
          {t.body}
        </p>
        <button
          onClick={handleSignOut}
          style={{ padding: '10px 24px', backgroundColor: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
        >
          {t.signOut}
        </button>
      </div>
    </div>
  )
}
