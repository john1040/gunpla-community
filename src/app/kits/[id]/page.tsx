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

interface Rating {
  average: number
  count: number
}


interface KitPageProps {
  params: Promise<{ id: string }>
}

export default function KitPage({ params }: KitPageProps) {
  const { id } = use(params)
  const kit = getKitById(id)
  const supabase = createClient()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Keep track of the user's current rating for UI purposes
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
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false // Don't retry on error
  })
  
  // Query for kit rating
  // Prefetch and cache rating data
  const { data: rating } = useQuery<Rating | null>({
    queryKey: ['rating', id],
    queryFn: () => getKitRating(id),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnMount: false, // Don't refetch on mount unless stale
    refetchOnWindowFocus: false // Don't refetch on window focus
  })

  // Query for user's current rating with prefetching
  const { data: userRating } = useQuery<number | null>({
    queryKey: ['userRating', id],
    queryFn: () => getUserKitRating(id),
    enabled: !!user, // Only run if user is logged in
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false
  })

  // Update userCurrentRating when userRating changes
  useEffect(() => {
    if (userRating !== undefined && userRating !== null) {
      setUserCurrentRating(userRating);
    }
  }, [userRating]);

  // Query for wanted list status with caching
  const { data: isInWanted } = useQuery({
    queryKey: ['wanted', id],
    queryFn: () => isInWantedList(id),
    enabled: !!user, // Only run if user is logged in
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false
  })

  // Mutation for rating
  const ratingMutation = useMutation({
    mutationFn: async ({ kitId, rating }: { kitId: string, rating: number }) => {
      await addRating(kitId, rating)
    },
    onSuccess: () => {
      // Instead of manually setting data, invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['rating', id] })
      queryClient.invalidateQueries({ queryKey: ['userRating', id] })
      toast({
        title: "Rating submitted",
        description: "Thank you for your rating!"
      })
    },
    onError: (error: Error) => {
      // Reset UI state on error
      setUserCurrentRating(userRating || null)
      console.error("Error submitting rating:", error)
      toast({
        title: "Error submitting rating",
        description: error.message || "Please try again later.",
        variant: "destructive"
      })
    }
  })

  // Mutation for wanted list
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
        description: isNowWanted ? "Added to wanted list!" : "Removed from wanted list"
      })
    },
    onError: (error: Error) => {
      console.error("Error updating wanted list:", error);
      toast({
        title: "Error updating wanted list",
        description: error.message || "Please try again later.",
        variant: "destructive"
      })
    }
  })

  // Subscribe to auth state and ratings changes
  useEffect(() => {
    // Auth state changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          queryClient.invalidateQueries({ queryKey: ['user'] })
          queryClient.invalidateQueries({ queryKey: ['userRating', id] })
        }
      }
    )

    // Ratings changes
    const ratingsChannel = supabase
      .channel('ratings_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ratings',
        filter: `kit_id=eq.${id}`
      }, () => {
        // Invalidate and refetch ratings
        queryClient.invalidateQueries({ queryKey: ['rating', id] })
        queryClient.invalidateQueries({ queryKey: ['userRating', id] })
      })
      .subscribe()

    // Wanted list changes
    const wantedChannel = supabase
      .channel('wanted_list')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wanted_list',
        filter: `kit_id=eq.${id}`
      }, () => {
        // Invalidate and refetch wanted status
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
        title: "Authentication required",
        description: "Please log in to rate kits.",
        variant: "destructive"
      })
      return
    }

    // Update local state immediately for better UX
    setUserCurrentRating(newRating)
    ratingMutation.mutate({ kitId: id, rating: newRating })
  }

  const handleWantedListToggle = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to manage your wanted list.",
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
          <span className="text-gray-500">RG Series</span>
          <span className="mx-2 text-gray-400">→</span>
          <span className="font-medium">{kit.title}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Carousel */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <ImageCarousel images={kit.imgUrlList} title={kit.title} />
          </div>

          {/* Kit Details */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-4">{kit.title}</h1>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-lg font-medium mb-3">Ratings</h3>
                {rating ? (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center">
                      <span className="text-xl font-semibold text-yellow-500">
                        {rating.average.toFixed(1)}
                      </span>
                      <span className="text-yellow-500 ml-1">★</span>
                    </div>
                    <span className="text-gray-500 text-sm">
                      ({rating.count} {rating.count === 1 ? 'rating' : 'ratings'})
                    </span>
                  </div>
                ) : (
                  <div className="text-gray-500 mb-4">No ratings yet</div>
                )}
                
                {user ? (
                  <>
                    <div className="text-sm text-gray-600 mb-2">
                      {userRating ? "Your rating (click to change):" : "Rate this kit:"}
                    </div>
                    <StarRating
                      initialRating={userCurrentRating ?? undefined}
                      disabled={ratingMutation.isPending}
                      onRate={handleRate}
                      size="md"
                    />
                    {ratingMutation.isPending && (
                      <div className="text-sm text-blue-500 mt-2">Saving your rating...</div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    Sign in to rate this kit
                  </div>
                )}
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-lg font-medium mb-3">Details</h3>
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
                  <div className="text-gray-500">Release Date</div>
                  <div className="font-medium">{kit.releaseDate}</div>
                  
                  <div className="text-gray-500">Price</div>
                  <div className="font-medium">{kit.price}</div>

                  {kit.categories?.brand && (
                    <>
                      <div className="text-gray-500">Brand</div>
                      <div className="font-medium">{kit.categories.brand}</div>
                    </>
                  )}
                  
                  {kit.categories?.series && (
                    <>
                      <div className="text-gray-500">Series</div>
                      <div className="font-medium">{kit.categories.series}</div>
                    </>
                  )}
                </div>

                {kit.description && (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-2">Description</h3>
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
                      Updating...
                    </span>
                  ) : isInWanted ? (
                    "Remove from Wanted List"
                  ) : (
                    "Add to Wanted List"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <CommentsSection kitId={id} user={user} isLoading={isUserLoading} />
        </div>
      </div>
    </div>
  )
}
