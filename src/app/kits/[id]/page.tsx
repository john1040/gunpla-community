"use client"

import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import rgKits from '../../../../public/data/rg.json'
import { ImageCarousel } from '@/components/kits/image-carousel'
import { CommentsSection } from '@/components/kits/comments-section'
import { addRating, getKitRating, addToWantedList, removeFromWantedList, isInWantedList } from '@/utils/supabase/kit-interactions'
import { createClient } from '@/utils/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { use, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Rating {
  average: number
  count: number
}

function getKitById(targetId: string) {
  return rgKits.find(kit => {
    const id = kit.url.split("/").filter(Boolean).pop() || ""
    return id === targetId
  })
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
  console.log('meow', user)
  // Query for kit rating
  const { data: rating } = useQuery<Rating | null>({
    queryKey: ['rating', id],
    queryFn: () => getKitRating(id)
  })

  // Query for wanted list status
  const { data: isInWanted } = useQuery({
    queryKey: ['wanted', id],
    queryFn: () => isInWantedList(id),
    enabled: !!user // Only run if user is logged in
  })

  // Mutation for rating
  const ratingMutation = useMutation({
    mutationFn: async ({ kitId, rating }: { kitId: string, rating: number }) => {
      await addRating(kitId, rating)
      return getKitRating(kitId)
    },
    onSuccess: (newRating) => {
      queryClient.setQueryData(['rating', id], newRating)
      toast({
        title: "Rating submitted",
        description: "Thank you for your rating!"
      })
    },
    onError: (error) => {
      console.error("Error submitting rating:", error)
      toast({
        title: "Error submitting rating",
        description: "Please try again later.",
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
    onError: (error) => {
      console.error("Error updating wanted list:", error)
      toast({
        title: "Error updating wanted list",
        description: "Please try again later.",
        variant: "destructive"
      })
    }
  })

  // Subscribe to auth state and wanted list changes
  useEffect(() => {
    // Auth state changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          queryClient.invalidateQueries({ queryKey: ['user'] })
        }
      }
    )

    // Wanted list changes
    const channel = supabase
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
      supabase.removeChannel(channel)
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
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Carousel */}
          <div>
            <ImageCarousel images={kit.imgUrlList} title={kit.title} />
          </div>

          {/* Kit Details */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{kit.title}</h1>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-4">
                  {rating ? (
                    <>
                      <span className="text-2xl font-semibold">
                        ★ {rating.average.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground">
                        ({rating.count} {rating.count === 1 ? 'rating' : 'ratings'})
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">No ratings yet</span>
                  )}
                </div>
                {user && (
                  <div className="mt-2">
                    <div className="text-sm text-muted-foreground mb-1">Rate this kit:</div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRate(star)}
                          disabled={ratingMutation.isPending}
                          className={`text-2xl transition-colors ${
                            ratingMutation.isPending ? 'cursor-not-allowed opacity-50' : 'hover:text-yellow-400'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                  RG
                </span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                  1/144
                </span>
              </div>

              <div className="space-y-2">
                <p className="font-medium">Release Date: {kit.releaseDate}</p>
                <p className="font-medium">Price: {kit.price}</p>
                {kit.exclusive && (
                  <p className="text-blue-600">{kit.exclusive}</p>
                )}
              </div>

              <Button 
                className="w-full"
                variant={isInWanted ? "default" : "outline"}
                onClick={handleWantedListToggle}
                disabled={wantedListMutation.isPending}
              >
                {wantedListMutation.isPending ? (
                  "Updating..."
                ) : isInWanted ? (
                  "Remove from Wanted List"
                ) : (
                  "Add to Wanted List"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <CommentsSection kitId={id} user={user} isLoading={isUserLoading} />
      </div>
    </div>
  )
}
