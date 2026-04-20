import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import commonEn from './locales/en/common.json'
import fileViewEn from './locales/en/fileView.json'
import reviewEn from './locales/en/review.json'

import commonVi from './locales/vi/common.json'
import fileViewVi from './locales/vi/fileView.json'
import reviewVi from './locales/vi/review.json'
import toursVi from './locales/vi/tours.json'
import toursEn from './locales/en/tours.json'

const resources = {
  en: {
    common: commonEn,
    fileView: fileViewEn,
    review: reviewEn,
    tours: toursEn
  },
  vi: {
    common: commonVi,
    fileView: fileViewVi,
    review: reviewVi,
    tours: toursVi
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'vi',
    ns: ['common', 'fileView', 'review', 'tours'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  })

export default i18n
