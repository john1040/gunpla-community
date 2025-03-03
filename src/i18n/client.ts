import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getOptions } from './settings'

// Import all translations
import en from '../../public/locales/en/common.json'
import ja from '../../public/locales/ja/common.json'
import zhHant from '../../public/locales/zh-Hant/common.json'

// Initialize i18next instance
const i18n = i18next.createInstance()

const initI18next = async () => {
  await i18n
    .use(initReactI18next)
    .init({
      ...getOptions(),
      resources: {
        en: { common: en },
        ja: { common: ja },
        'zh-Hant': { common: zhHant }
      },
      lng: undefined, // Let detect the language on client side
      preload: ['en', 'ja', 'zh-Hant'],
      fallbackLng: 'en',
      supportedLngs: ['en', 'ja', 'zh-Hant'],
      defaultNS: 'common',
      detection: {
        order: ['path', 'htmlTag', 'navigator']
      }
    })
}

// Only initialize if window is defined (client-side)
if (typeof window !== 'undefined') {
  initI18next()
}

export default i18n