"use client"

import Link from "next/link"

interface KitCardProps {
  title: string
  imageUrl?: string
  price: string
  releaseDate: string
  exclusive: string
  url: string
}

export function KitCard({ title, imageUrl, price, releaseDate, exclusive, url }: KitCardProps) {
  // Extract the ID from either format:
  // "/item/6469/" -> "6469"
  // "https://p-bandai.jp/item/item-1000216105/" -> "item-1000216105"
  const id = url.split("/").filter(Boolean).pop() || ""
  
  return (
    <Link href={`/kits/${id}`} className="block">
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
        <p className="text-sm text-muted-foreground mt-1">{price}</p>
        <div className="mt-2 flex flex-col gap-1">
          <span className="text-sm">{releaseDate}</span>
          {exclusive && (
            <span className="text-sm text-blue-600 font-medium">{exclusive}</span>
          )}
        </div>
      </div>
    </Link>
  )
}