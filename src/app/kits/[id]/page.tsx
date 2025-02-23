"use client"

import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import rgKits from '../../../../public/data/rg.json'
import { ImageCarousel } from '@/components/kits/image-carousel'
import { CommentsSection } from '@/components/kits/comments-section'
import { useEffect, useState } from 'react'
import { addRating, getKitRating, addToWantedList, removeFromWantedList, isInWantedList } from '@/utils/supabase/kit-interactions'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/components/ui/use-toast'
import { use } from 'react'

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
  const [rating, setRating] = useState<Rating | null>(null)
  const [isRating, setIsRating] = useState(false)
  const [isInWanted, setIsInWanted] = useState(false)
  const [isUpdatingWanted, setIsUpdatingWanted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    // Load rating and wanted status
    const loadData = async () => {
      try {
        const [rating, wanted] = await Promise.all([
          getKitRating(id),
          isInWantedList(id)
        ])
        setRating(rating)
        setIsInWanted(wanted)
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }

    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    loadData()
    getUser()

    // Subscribe to wanted list changes
    const channel = supabase
      .channel('wanted_list')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wanted_list',
        filter: `kit_id=eq.${id}`
      }, async () => {
        // Refresh wanted list status
        const wanted = await isInWantedList(id)
        setIsInWanted(wanted)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, supabase])

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

    setIsRating(true)
    try {
      await addRating(id, newRating)
      const updatedRating = await getKitRating(id)
      setRating(updatedRating)
      toast({
        title: "Rating submitted",
        description: "Thank you for your rating!"
      })
    } catch (error) {
      console.error("Error submitting rating:", error)
      toast({
        title: "Error submitting rating",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsRating(false)
    }
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

    setIsUpdatingWanted(true)
    try {
      if (isInWanted) {
        await removeFromWantedList(id)
        setIsInWanted(false)
        toast({
          description: "Removed from wanted list"
        })
      } else {
        await addToWantedList(id)
        setIsInWanted(true)
        toast({
          description: "Added to wanted list!"
        })
      }
    } catch (error) {
      console.error("Error updating wanted list:", error)
      toast({
        title: "Error updating wanted list",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsUpdatingWanted(false)
    }
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
                          disabled={isRating}
                          className={`text-2xl transition-colors ${
                            isRating ? 'cursor-not-allowed opacity-50' : 'hover:text-yellow-400'
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
                disabled={isUpdatingWanted}
              >
                {isUpdatingWanted ? (
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
        <CommentsSection kitId={id} />
      </div>
    </div>
  )
}
