import { getKitWithDetails } from '@/lib/supabase/queries'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export default async function KitPage({
  params: { id },
}: {
  params: { id: string }
}) {
  const kit = await getKitWithDetails(id)

  if (!kit) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div>
            <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
              {kit.kit_images?.[0]?.image_url ? (
                <Image
                  src={kit.kit_images[0].image_url}
                  alt={kit.name_en}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image Available
                </div>
              )}
            </div>
          </div>

          {/* Kit Details */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{kit.name_en}</h1>
            {kit.name_jp && (
              <h2 className="text-xl text-muted-foreground mb-4">{kit.name_jp}</h2>
            )}
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-semibold">
                    ★ {kit.average_rating?.toFixed(1) ?? 'No ratings'}
                  </span>
                  {kit.ratings?.length ? (
                    <span className="text-muted-foreground">
                      ({kit.ratings.length} ratings)
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex gap-2">
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                  {kit.grade}
                </span>
                <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                  {kit.scale}
                </span>
              </div>

              {kit.description && (
                <p className="text-muted-foreground">{kit.description}</p>
              )}

              <Button className="w-full">Add to Wanted List</Button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Comments</h2>
          <div className="space-y-6">
            {kit.comments?.length ? (
              kit.comments.map((comment) => (
                <div key={comment.id} className="border-b pb-6">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      {comment.user.avatar ? (
                        <Image
                          src={comment.user.avatar}
                          alt={comment.user.name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <span className="text-lg text-gray-500">
                          {comment.user.name[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{comment.user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{comment.content}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      ♥ {comment.likes}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No comments yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}