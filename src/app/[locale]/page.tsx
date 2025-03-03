import { getTranslations } from '@/i18n/server'
import Link from 'next/link'



export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; // Extract locale inside the function
  const { t } = await getTranslations(locale, 'common')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">
          {t('home.welcome')}
        </h1>
        
        <p className="text-xl mb-8">
          {t('home.description')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-bold mb-4">{t('home.features.browse.title')}</h2>
            <p className="mb-4">{t('home.features.browse.description')}</p>
            <Link
              href={`/${locale}/kits`}
              className="inline-block px-6 py-3 bg-[#FFE500] text-black font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              {t('home.features.browse.action')}
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-bold mb-4">{t('home.features.profile.title')}</h2>
            <p className="mb-4">{t('home.features.profile.description')}</p>
            <Link
              href={`/${locale}/profile`}
              className="inline-block px-6 py-3 bg-[#57FFC9] text-black font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              {t('home.features.profile.action')}
            </Link>
          </div>
        </div>

        <div className="text-center">
          <p className="text-lg mb-4">{t('home.languageSupport')}</p>
          <div className="flex justify-center gap-4">
            <Link
              href="/en"
              className={`px-4 py-2 rounded-md ${locale === 'en' ? 'bg-[#FFE500] font-bold' : 'hover:bg-gray-100'}`}
            >
              English
            </Link>
            <Link
              href="/ja"
              className={`px-4 py-2 rounded-md ${locale === 'ja' ? 'bg-[#FFE500] font-bold' : 'hover:bg-gray-100'}`}
            >
              日本語
            </Link>
            <Link
              href="/zh-Hant"
              className={`px-4 py-2 rounded-md ${locale === 'zh-Hant' ? 'bg-[#FFE500] font-bold' : 'hover:bg-gray-100'}`}
            >
              繁體中文
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
