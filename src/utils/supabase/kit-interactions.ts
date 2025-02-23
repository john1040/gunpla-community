import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "./types";

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  kit_id: string;
  user: {
    id: string;
    display_name: string;
    avatar_url: string;
  };
  likes_count: number;
  user_has_liked: boolean;
}

interface CommentLike {
  id: string;
  user_id: string;
  comment_id: string;
}

// Initialize Supabase client
const createClient = () => createClientComponentClient<Database>();

// Comment functions
export async function addComment(kitId: string, content: string) {
  const supabase = createClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Must be logged in to comment");

  const { data, error } = await supabase
    .from("comments")
    .insert({
      kit_id: kitId,
      user_id: user.user.id,
      content,
    })
    .select(`
      *,
      user:user_profiles(
        id,
        display_name,
        avatar_url
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function getComments(kitId: string) {
  const supabase = createClient();
  
  // Get current user to check if they've liked comments
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from("comments")
    .select(`
      *,
      user:user_profiles(
        id,
        display_name,
        avatar_url
      ),
      likes:comment_likes(count),
      user_likes:comment_likes!inner(id, user_id)
    `)
    .eq("kit_id", kitId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Transform data to include likes count and whether user has liked
  return data.map(comment => ({
    ...comment,
    likes_count: comment.likes?.[0]?.count ?? 0,
    user_has_liked: comment.user_likes?.some((like: CommentLike) => 
      like.user_id === user?.id
    ) ?? false
  }));
}

export async function toggleCommentLike(commentId: string) {
  const supabase = createClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Must be logged in to like comments");

  // Check if user has already liked
  const { data: existingLike } = await supabase
    .from("comment_likes")
    .select()
    .eq("comment_id", commentId)
    .eq("user_id", user.user.id)
    .single();

  if (existingLike) {
    // Unlike
    const { error } = await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user.user.id);

    if (error) throw error;
    return false;
  } else {
    // Like
    const { error } = await supabase
      .from("comment_likes")
      .insert({
        comment_id: commentId,
        user_id: user.user.id
      });

    if (error) throw error;
    return true;
  }
}

// Rating functions
export async function addRating(kitId: string, rating: number) {
  const supabase = createClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Must be logged in to rate");

  const { data, error } = await supabase
    .from("ratings")
    .upsert({
      kit_id: kitId,
      user_id: user.user.id,
      rating
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getKitRating(kitId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("ratings")
    .select("rating")
    .eq("kit_id", kitId);

  if (error) throw error;

  if (!data.length) return null;

  // Calculate average rating
  const avgRating = data.reduce((sum, curr) => sum + curr.rating, 0) / data.length;
  return {
    average: avgRating,
    count: data.length
  };
}

// Wanted List functions
export async function addToWantedList(kitId: string) {
  const supabase = createClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Must be logged in to add to wanted list");

  const { data, error } = await supabase
    .from("wanted_list")
    .insert({
      kit_id: kitId,
      user_id: user.user.id
    })
    .select()
    .single();

  if (error) {
    // If already in wanted list, don't throw error
    if (error.code === '23505') { // Unique constraint violation
      return null;
    }
    throw error;
  }
  
  return data;
}

export async function removeFromWantedList(kitId: string) {
  const supabase = createClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Must be logged in to remove from wanted list");

  const { error } = await supabase
    .from("wanted_list")
    .delete()
    .eq("kit_id", kitId)
    .eq("user_id", user.user.id);

  if (error) throw error;
}

export async function isInWantedList(kitId: string) {
  const supabase = createClient();
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return false;

  const { data, error } = await supabase
    .from("wanted_list")
    .select()
    .eq("kit_id", kitId)
    .eq("user_id", user.user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return false; // Not found
    throw error;
  }

  return !!data;
}