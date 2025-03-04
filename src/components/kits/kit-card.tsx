"use client"

import Link from "next/link"

export interface KitCardProps {
  title: string
  imageUrl?: string
  price?: string
  releaseDate?: string
  exclusive?: string
  url: string
  grade?: string
  rating?: {
    average: number
    count: number
  } | null
  ratingCount?: number
  locale: string // Add locale prop
}

export function KitCard({
  title,
  imageUrl,
  price,
  releaseDate,
  exclusive,
  url,
  grade,
  rating,
  ratingCount,
  locale
}: KitCardProps) {
  // Extract the ID from either format:
  // "/item/6469/" -> "6469"
  // "https://p-bandai.jp/item/item-1000216105/" -> "item-1000216105"
  const id = url.split("/").filter(Boolean).pop() || ""
  
  return (
    <Link href={`/${locale}/kits/${id}`} className="block">
      <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="aspect-square bg-gray-100 rounded-md mb-4 overflow-hidden">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <h3 className="text-lg font-semibold line-clamp-2">{title}</h3>
        <div className="flex items-center gap-2 mt-1">
          {grade && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {grade}
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-col gap-1">
          {price && <p className="text-sm text-muted-foreground">{price}</p>}
          {releaseDate && <span className="text-sm">{releaseDate}</span>}
          {exclusive && (
            <span className="text-sm text-blue-600 font-medium">{exclusive}</span>
          )}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-yellow-400 text-2xl">★</span>
            {rating || ratingCount ? (
              <div className="flex items-baseline gap-2">
                {rating && (
                  <span className="text-lg font-semibold text-gray-800">
                    {rating.average.toFixed(1)}
                  </span>
                )}
                <span className="text-gray-500">
                  ({rating?.count || ratingCount} {(rating?.count || ratingCount) === 1 ? 'rating' : 'ratings'})
                </span>
              </div>
            ) : (
              <span className="text-gray-500 text-lg">
                Not yet rated
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
