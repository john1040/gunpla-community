import Image from 'next/image'
import Link from 'next/link'
import { type Database } from '@/lib/supabase/types'

type Kit = Database['public']['Tables']['kits']['Row']
type KitImage = Database['public']['Tables']['kit_images']['Row']

interface KitCardProps {
  kit: Kit
  image?: KitImage
  rating?: number
  ratingCount?: number
}

export function KitCard({ kit, image, rating, ratingCount }: KitCardProps) {
  return (
    <Link href={`/kits/${kit.id}`}>
      <div className="border rounded-lg p-4 transition-shadow hover:shadow-md">
        <div className="aspect-square relative mb-4 bg-gray-100 rounded-md overflow-hidden">
          {image ? (
            <Image
              src={image.image_url}
              alt={kit.name_en}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>
        <h3 className="text-lg font-semibold truncate">{kit.name_en}</h3>
        {kit.name_jp && (
          <p className="text-sm text-muted-foreground truncate">{kit.name_jp}</p>
        )}
        <p className="text-sm text-muted-foreground">{kit.grade}</p>
        {typeof rating !== 'undefined' && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm">★ {rating.toFixed(1)}</span>
            {typeof ratingCount !== 'undefined' && (
              <span className="text-sm text-muted-foreground">
                ({ratingCount} ratings)
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}