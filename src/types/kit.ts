interface TranslatedString {
  ja: string
  en: string
  'zh-Hant': string
}

interface TranslatedCategories {
  brand: TranslatedString
  series?: TranslatedString
}

export interface LegacyKit {
  title: string
  releaseDate: string
  isoReleaseDate: string
  url: string
  exclusive: string
  price: string
  description: string
  categories: {
    brand: string
    series?: string
  }
  imgUrlList: string[]
}

export interface TranslatedKit {
  title: TranslatedString
  releaseDate: string
  isoReleaseDate: string
  url: string
  exclusive: string
  price: string
  description: TranslatedString
  categories: TranslatedCategories
  imgUrlList: string[]
}

export type Kit = LegacyKit | TranslatedKit

export function isTranslatedKit(kit: Kit): kit is TranslatedKit {
  return typeof kit.title === 'object' && 'ja' in kit.title;
}