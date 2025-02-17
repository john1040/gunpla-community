import { Database } from './types'
import { createServerClient } from '@supabase/ssr'
import { createCookieOptions } from '@/lib/utils/cookies'

type KitRating = Database['public']['Tables']['ratings']['Row']
type KitComment = Database['public']['Tables']['comments']['Row'] & {
  user_profiles?: {
    display_name: string | null
    avatar_url: string | null
  } | null
  comment_likes?: { user_id: string }[]
}

type KitDetails = Database['public']['Tables']['kits']['Row'] & {
  kit_images?: { image_url: string }[] | null
  ratings?: KitRating[] | null
  comments?: KitComment[] | null
}

export async function getKitWithDetails(kitId: string) {
  const cookieOptions = await createCookieOptions()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieOptions
    }
  )

  const { data: kit } = await supabase
    .from('kits')
    .select(`
      *,
      kit_images (
        image_url
      ),
      ratings (
        rating
      ),
      comments (
        id,
        content,
        created_at,
        user_id,
        user_profiles (
          display_name,
          avatar_url
        ),
        comment_likes (
          user_id
        )
      )
    `)
    .eq('id', kitId)
    .single()

  if (!kit) return null

  const kitDetails = kit as KitDetails

  // Calculate average rating
  const ratings = kitDetails.ratings || []
  const averageRating = ratings.length
    ? ratings.reduce((acc: number, curr: KitRating) => acc + curr.rating, 0) / ratings.length
    : null

  // Format comments
  const comments = (kitDetails.comments || []).map((comment: KitComment) => ({
    id: comment.id,
    content: comment.content,
    created_at: comment.created_at,
    user: {
      id: comment.user_id,
      name: comment.user_profiles?.display_name || 'Anonymous',
      avatar: comment.user_profiles?.avatar_url,
    },
    likes: comment.comment_likes?.length || 0,
  }))

  return {
    ...kitDetails,
    average_rating: averageRating,
    comments,
  }
}

export async function addKitToWantedList(kitId: string, userId: string) {
  const cookieOptions = await createCookieOptions()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieOptions
    }
  )

  const { error } = await supabase
    .from('wanted_list')
    .insert({ kit_id: kitId, user_id: userId })

  return { error }
}

export async function removeKitFromWantedList(kitId: string, userId: string) {
  const cookieOptions = await createCookieOptions()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieOptions
    }
  )

  const { error } = await supabase
    .from('wanted_list')
    .delete()
    .match({ kit_id: kitId, user_id: userId })

  return { error }
}

export async function rateKit(kitId: string, userId: string, rating: number) {
  const cookieOptions = await createCookieOptions()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieOptions
    }
  )

  const { error } = await supabase
    .from('ratings')
    .upsert(
      { kit_id: kitId, user_id: userId, rating },
      { onConflict: 'user_id,kit_id' }
    )

  return { error }
}