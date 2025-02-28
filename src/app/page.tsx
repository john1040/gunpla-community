"use client"

import { useQuery } from "@tanstack/react-query"
import { getTopRatedKits, getRecentKits } from "@/utils/supabase/kit-interactions"
import { KitCard } from "@/components/kits/kit-card"
import Link from "next/link"

export default function Home() {
  // Query for top rated kits
  const { data: topRatedKits = [] } = useQuery({
    queryKey: ['topRatedKits'],
    queryFn: () => getTopRatedKits(4)
  })

  // Query for recent kits
  const { data: recentKits = [] } = useQuery({
    queryKey: ['recentKits'],
    queryFn: () => getRecentKits(4)
  })

  return (
    <div className="container mx-auto py-6 px-4">
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to Gunpla Community</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Your go-to platform for discovering, rating, and discussing Gunpla kits.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Discover</h3>
            <p className="text-muted-foreground">
              Browse through our extensive collection of Gunpla kits
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Rate & Review</h3>
            <p className="text-muted-foreground">
              Share your thoughts and experiences with the community
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Track</h3>
            <p className="text-muted-foreground">
              Keep track of your wanted kits and share your collection
            </p>
          </div>
        </div>
      </section>

      {/* Top Rated Kits Section */}
      <section className="py-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Top Rated Kits</h2>
          <Link 
            href="/kits" 
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {topRatedKits.map((kit) => (
            <KitCard
              key={kit.id}
              title={kit.name_en}
              imageUrl={kit.imageUrl}
              grade={kit.grade}
              rating={{
                average: kit.averageRating,
                count: kit.ratingCount
              }}
              url={`/kits/${kit.id}`}
            />
          ))}
        </div>
      </section>

      {/* Recently Added Kits Section */}
      <section className="py-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Recently Added</h2>
          <Link 
            href="/kits" 
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recentKits.map((kit) => (
            <KitCard
              key={kit.id}
              title={kit.name_en}
              imageUrl={kit.imageUrl}
              grade={kit.grade}
              url={`/kits/${kit.id}`}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
