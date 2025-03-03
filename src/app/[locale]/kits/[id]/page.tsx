"use client"

import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ImageCarousel } from '@/components/kits/image-carousel'
import { CommentsSection } from '@/components/kits/comments-section'
import { StarRating } from '@/components/kits/star-rating'
import { addRating, getKitRating, addToWantedList, removeFromWantedList, isInWantedList, getUserKitRating } from '@/utils/supabase/kit-interactions'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { use, useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getKitById } from '@/utils/kit-data'
import { useTranslationClient } from '@/hooks/use-translation-client'

interface Rating {
  average: number
  count: number
}

interface KitPageProps {
  params: Promise<{ id: string; locale: string }>
}

export default function KitPage({ params }: KitPageProps) {
  const { id, locale } = use(params)
  const { t } = useTranslationClient(locale)
  const kit = getKitById(id)
  const supabase = createClient()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [userCurrentRating, setUserCurrentRating] = useState<number | null>(null);

  // Query for current user
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error getting session:', error)
        return null
      }
      if (!session) {
        return null
      }
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('Error getting user:', userError)
        return null
      }
      return user
    },
    staleTime: 1000 * 60 * 5,
    retry: false
  })
  
  // Query for kit rating
  const { data: rating } = useQuery<Rating | null>({
    queryKey: ['rating', id],
    queryFn: () => getKitRating(id),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  })

  // Query for user's current rating
  const { data: userRating } = useQuery<number | null>({
    queryKey: ['userRating', id],
    queryFn: () => getUserKitRating(id),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  })

  useEffect(() => {
    if (userRating !== undefined && userRating !== null) {
      setUserCurrentRating(userRating);
    }
  }, [userRating]);

  // Query for wanted list status
  const { data: isInWanted } = useQuery({
    queryKey: ['wanted', id],
    queryFn: () => isInWantedList(id),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  })

  // Mutations
  const ratingMutation = useMutation({
    mutationFn: async ({ kitId, rating }: { kitId: string, rating: number }) => {
      await addRating(kitId, rating)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rating', id] })
      queryClient.invalidateQueries({ queryKey: ['userRating', id] })
      toast({
        title: t('kits.rating.submitted'),
        description: t('kits.rating.thankYou')
      })
    },
    onError: (error: Error) => {
      setUserCurrentRating(userRating || null)
      console.error("Error submitting rating:", error)
      toast({
        title: t('kits.rating.error'),
        description: error.message || t('common.tryAgainLater'),
        variant: "destructive"
      })
    }
  })

  const wantedListMutation = useMutation({
    mutationFn: async ({ kitId, add }: { kitId: string, add: boolean }) => {
      if (add) {
        await addToWantedList(kitId)
        return true
      } else {
        await removeFromWantedList(kitId)
        return false
      }
    },
    onSuccess: (isNowWanted) => {
      queryClient.setQueryData(['wanted', id], isNowWanted)
      toast({
        description: isNowWanted ? t('kits.wishlist.added') : t('kits.wishlist.removed')
      })
    },
    onError: (error: Error) => {
      console.error("Error updating wanted list:", error);
      toast({
        title: t('kits.wishlist.error'),
        description: error.message || t('common.tryAgainLater'),
        variant: "destructive"
      })
    }
  })

  // Subscriptions
  useEffect(() => {
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          queryClient.invalidateQueries({ queryKey: ['user'] })
          queryClient.invalidateQueries({ queryKey: ['userRating', id] })
        }
      }
    )

    const ratingsChannel = supabase
      .channel('ratings_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ratings',
        filter: `kit_id=eq.${id}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['rating', id] })
        queryClient.invalidateQueries({ queryKey: ['userRating', id] })
      })
      .subscribe()

    const wantedChannel = supabase
      .channel('wanted_list')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wanted_list',
        filter: `kit_id=eq.${id}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['wanted', id] })
      })
      .subscribe()

    return () => {
      authSubscription.unsubscribe()
      supabase.removeChannel(ratingsChannel)
      supabase.removeChannel(wantedChannel)
    }
  }, [id, supabase, queryClient])

  if (!kit) {
    notFound()
  }

  const handleRate = async (newRating: number) => {
    if (!user) {
      toast({
        title: t('auth.required'),
        description: t('kits.rating.loginRequired'),
        variant: "destructive"
      })
      return
    }

    setUserCurrentRating(newRating)
    ratingMutation.mutate({ kitId: id, rating: newRating })
  }

  const handleWantedListToggle = async () => {
    if (!user) {
      toast({
        title: t('auth.required'),
        description: t('kits.wishlist.loginRequired'),
        variant: "destructive"
      })
      return
    }

    wantedListMutation.mutate({ kitId: id, add: !isInWanted })
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="text-sm mb-6">
          <span className="text-gray-500">{t('kits.grade')}</span>
          <span className="mx-2 text-gray-400">→</span>
          <span className="font-medium">{kit.title}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <ImageCarousel images={kit.imgUrlList} title={kit.title} />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-4">{kit.title}</h1>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-lg font-medium mb-3">{t('kits.rating.title')}</h3>
                {rating ? (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center">
                      <span className="text-xl font-semibold text-yellow-500">
                        {rating.average.toFixed(1)}
                      </span>
                      <span className="text-yellow-500 ml-1">★</span>
                    </div>
                    <span className="text-gray-500 text-sm">
                      ({rating.count} {t('kits.rating.count', { count: rating.count })})
                    </span>
                  </div>
                ) : (
                  <div className="text-gray-500 mb-4">{t('kits.rating.noRatings')}</div>
                )}
                
                {user ? (
                  <>
                    <div className="text-sm text-gray-600 mb-2">
                      {userRating ? t('kits.rating.yourRating') : t('kits.rating.rateKit')}
                    </div>
                    <StarRating
                      initialRating={userCurrentRating ?? undefined}
                      disabled={ratingMutation.isPending}
                      onRate={handleRate}
                      size="md"
                    />
                    {ratingMutation.isPending && (
                      <div className="text-sm text-blue-500 mt-2">{t('kits.rating.saving')}</div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    {t('kits.rating.signInToRate')}
                  </div>
                )}
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-lg font-medium mb-3">{t('kits.details.title')}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    RG
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                    1/144
                  </span>
                  {kit.exclusive && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      {kit.exclusive}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div className="text-gray-500">{t('kits.releaseDate')}</div>
                  <div className="font-medium">{kit.releaseDate}</div>
                  
                  <div className="text-gray-500">{t('kits.details.price')}</div>
                  <div className="font-medium">{kit.price}</div>

                  {kit.categories?.brand && (
                    <>
                      <div className="text-gray-500">{t('kits.details.brand')}</div>
                      <div className="font-medium">{kit.categories.brand}</div>
                    </>
                  )}
                  
                  {kit.categories?.series && (
                    <>
                      <div className="text-gray-500">{t('kits.details.series')}</div>
                      <div className="font-medium">{kit.categories.series}</div>
                    </>
                  )}
                </div>

                {kit.description && (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-2">{t('kits.details.description')}</h3>
                    <div 
                      className="text-sm text-gray-600"
                      dangerouslySetInnerHTML={{ __html: kit.description }}
                    />
                  </div>
                )}
              </div>

              <div className="mt-4">
              <Button 
  className="w-full"
  variant={isInWanted ? "default" : "outline"}
  onClick={handleWantedListToggle}
  disabled={wantedListMutation.isPending}
  size="lg"
>
  {wantedListMutation.isPending ? (
    <span className="flex items-center gap-2">
      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {t('common.updating')}
    </span>
  ) : isInWanted ? (
    t('kits.removeFromWishlist')
  ) : (
    t('kits.addToWishlist')
  )}
</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <CommentsSection kitId={id} user={user} isLoading={isUserLoading} />
        </div>
      </div>
    </div>
  )
}