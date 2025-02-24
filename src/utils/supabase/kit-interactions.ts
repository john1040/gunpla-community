import { Database } from "./types";
import { createClient as createSupabaseClient } from "./client";
import { User } from "@supabase/supabase-js";

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
const createClient = () => createSupabaseClient();

// Comment functions
// Helper function to extract numeric ID from URL
function getKitId(url: string): string {
  const matches = url.match(/\/item\/(\d+)/);
  return matches ? matches[1] : url;
}

// Function to ensure kit exists in database
async function ensureKitExists(kitId: string) {
  const supabase = createClient();
  const numericKitId = getKitId(kitId);

  // First check if kit exists
  const { data: existingKit } = await supabase
    .from("kits")
    .select("id")
    .eq("id", numericKitId)
    .single();

  if (!existingKit) {
    // If kit doesn't exist, create it with minimal data
    const { error: insertError } = await supabase
      .from("kits")
      .insert({
        id: numericKitId,
        name_en: `RG Kit ${numericKitId}`, // Placeholder name
        grade: "RG",
        scale: "1/144"
      });

    if (insertError) {
      console.error("Error ensuring kit exists:", insertError);
      throw new Error(`Failed to create kit record: ${insertError.message}`);
    }
  }
}

export async function addComment(kitId: string, content: string) {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Must be logged in to comment");
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Could not get user data");

  const numericKitId = getKitId(kitId);
  let data;

  try {
    // Ensure kit exists before adding comment
    await ensureKitExists(numericKitId);

    const result = await supabase
      .from("comments")
      .insert({
        kit_id: numericKitId,
        user_id: user.id,
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

    if (result.error) {
      console.error("Supabase error:", result.error);
      throw new Error(`Failed to add comment: ${result.error.message}`);
    }

    if (!result.data) {
      throw new Error("No data returned after adding comment");
    }

    data = result.data;
  } catch (error) {
    console.error("Error in addComment:", error);
    throw error;
  }

  return data;
}

export async function getComments(kitId: string) {
  const supabase = createClient();
  let currentUser: User | null = null;
  
  try {
    // Get current user to check if they've liked comments
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: { user } } = await supabase.auth.getUser();
      currentUser = user;
    }
    
    const numericKitId = getKitId(kitId);
    
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
        user_likes:comment_likes(id, user_id)
      `)
      .eq("kit_id", numericKitId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      throw new Error(`Failed to get comments: ${error.message}`);
    }

    // If no comments found, return empty array
    if (!data || data.length === 0) {
      return [];
    }

    // Transform data to include likes count and whether user has liked
    return data.map(comment => ({
      ...comment,
      likes_count: comment.likes?.[0]?.count ?? 0,
      user_has_liked: comment.user_likes?.some((like: CommentLike) =>
        like.user_id === currentUser?.id
      ) ?? false
    }));
  } catch (error) {
    console.error("Error in getComments:", error);
    throw error;
  }
}

export async function toggleCommentLike(commentId: string) {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Must be logged in to like comments");
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Could not get user data");

  // Check if user has already liked
  const { data: existingLike } = await supabase
    .from("comment_likes")
    .select()
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .single();

  if (existingLike) {
    // Unlike
    const { error } = await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user.id);

    if (error) throw error;
    return false;
  } else {
    // Like
    const { error } = await supabase
      .from("comment_likes")
      .insert({
        comment_id: commentId,
        user_id: user.id
      });

    if (error) throw error;
    return true;
  }
}

// Rating functions
export async function addRating(kitId: string, rating: number) {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Must be logged in to rate");
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Could not get user data");

  const numericKitId = getKitId(kitId);

  const { data, error } = await supabase
    .from("ratings")
    .upsert({
      kit_id: numericKitId,
      user_id: user.id,
      rating
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getKitRating(kitId: string) {
  const supabase = createClient();

  const numericKitId = getKitId(kitId);

  const { data, error } = await supabase
    .from("ratings")
    .select("rating")
    .eq("kit_id", numericKitId);

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
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Must be logged in to add to wanted list");
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Could not get user data");

  const numericKitId = getKitId(kitId);

  const { data, error } = await supabase
    .from("wanted_list")
    .insert({
      kit_id: numericKitId,
      user_id: user.id
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
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Must be logged in to remove from wanted list");
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Could not get user data");

  const numericKitId = getKitId(kitId);

  const { error } = await supabase
    .from("wanted_list")
    .delete()
    .eq("kit_id", numericKitId)
    .eq("user_id", user.id);

  if (error) throw error;
}

export async function isInWantedList(kitId: string) {
  const supabase = createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const numericKitId = getKitId(kitId);

  const { data, error } = await supabase
    .from("wanted_list")
    .select()
    .eq("kit_id", numericKitId)
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return false; // Not found
    throw error;
  }

  return !!data;
}
