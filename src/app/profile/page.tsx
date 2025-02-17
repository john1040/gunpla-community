import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Database } from '@/lib/supabase/types'
import { createCookieOptions } from '@/lib/utils/cookies'

type WantedKit = {
  kit_id: string
  kits: {
    id: string
    name_en: string
    grade: string
    kit_images: {
      image_url: string
    }[]
  } | null
}

export default async function ProfilePage() {
  const cookieOptions = await createCookieOptions()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieOptions
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const { data: wantedKits } = await supabase
    .from('wanted_list')
    .select(`
      kit_id,
      kits (
        id,
        name_en,
        grade,
        kit_images (
          image_url
        )
      )
    `)
    .eq('user_id', session.user.id) as { data: WantedKit[] | null }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl text-gray-500">
                {session.user.email?.[0].toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {profile?.display_name || 'User Profile'}
            </h1>
            <p className="text-muted-foreground">{session.user.email}</p>
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">Wanted Kits</h2>
            {wantedKits?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {wantedKits.map((item) => (
                  item.kits && (
                    <div
                      key={item.kit_id}
                      className="border rounded-lg p-4 flex items-center gap-4"
                    >
                      <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0">
                        {item.kits.kit_images?.[0]?.image_url && (
                          <img
                            src={item.kits.kit_images[0].image_url}
                            alt={item.kits.name_en}
                            className="w-full h-full object-cover rounded-md"
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{item.kits.name_en}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.kits.grade}
                        </p>
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No kits in wanted list yet.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}