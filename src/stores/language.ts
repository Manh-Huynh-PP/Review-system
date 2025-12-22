import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Language = 'vi' | 'en'

interface LanguageState {
    language: Language
    setLanguage: (lang: Language) => void
    toggleLanguage: () => void
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set) => ({
            language: 'vi', // Default to Vietnamese as per user preference in previous interactions or default for this region
            setLanguage: (lang) => set({ language: lang }),
            toggleLanguage: () => set((state) => ({ language: state.language === 'vi' ? 'en' : 'vi' })),
        }),
        {
            name: 'language-storage',
        }
    )
)
