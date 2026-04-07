import en from './en'
import zhTW from './zh-TW'

type Translations = Record<keyof typeof en, string>
export type TranslationKey = keyof typeof en

const locales: Record<string, Translations> = {
  en,
  'zh-TW': zhTW,
}

export const SUPPORTED_LOCALES = ['en', 'zh-TW'] as const
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
const DEFAULT_LOCALE: SupportedLocale = 'en'
const STORAGE_KEY = 'locale'

let currentLocale: SupportedLocale = DEFAULT_LOCALE

export function initLocale(): void {
  currentLocale = detectLocale()
  document.documentElement.lang = currentLocale
}

export function getLocale(): SupportedLocale {
  return currentLocale
}

export function setLocale(locale: SupportedLocale): void {
  localStorage.setItem(STORAGE_KEY, locale)
  window.location.reload()
}

export function t(key: TranslationKey, params?: Record<string, string>): string {
  const table = locales[currentLocale] ?? locales[DEFAULT_LOCALE]!
  let value: string = table[key] ?? locales[DEFAULT_LOCALE]![key] ?? key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replaceAll(`{${k}}`, v)
    }
  }
  return value
}

function detectLocale(): SupportedLocale {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && isSupportedLocale(stored)) return stored

  const nav = navigator.language
  if (isSupportedLocale(nav)) return nav

  const prefix = nav.split('-')[0]
  const match = SUPPORTED_LOCALES.find((l) => l.startsWith(prefix))
  return match ?? DEFAULT_LOCALE
}

function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}
