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
export async function ensureKitExists(kitId: string) {
  const supabase = createClient();
  const numericKitId = getKitId(kitId);

  // First check if kit exists
  const { data: existingKit } = await supabase
    .from("kits")
    .select("id")
    .eq("id", numericKitId)
    .single();

  if (!existingKit) {
    try {
      // Fetch RG data from public folder
      const response = await fetch('/data/rg.json');
      if (!response.ok) {
        throw new Error('Failed to fetch RG data');
      }
      const rgData = await response.json();

      // Find kit in RG data
      const kitData = rgData.find((kit: any) => {
        const kitUrl = kit.url;
        return kitUrl === `/item/${numericKitId}/` || kitUrl === `https://p-bandai.jp/item/item-${numericKitId}/`;
      });

      // Prepare kit data
      const kitInfo = {
        id: numericKitId,
        name_en: kitData ? kitData.title : `RG Kit ${numericKitId}`,
        name_jp: null,
        grade: "RG",
        scale: "1/144",
        release_date: kitData ?
          new Date(kitData.releaseDate.replace(/年|月|日/g, '-').slice(0, -1)) :
          null,
        product_image: kitData?.imgUrlList?.[0] || null
      };

      // Insert kit record
      const { error: insertError } = await supabase
        .from("kits")
        .insert(kitInfo);

      if (insertError) {
        console.error("Error ensuring kit exists:", insertError);
        throw new Error(`Failed to create kit record: ${insertError.message}`);
      }

      // If kit has images, insert them
      if (kitData && kitData.imgUrlList && kitData.imgUrlList.length > 0) {
        const { error: imageInsertError } = await supabase
          .from("kit_images")
          .insert(
            kitData.imgUrlList.map((url: string) => ({
              kit_id: numericKitId,
              image_url: url
            }))
          );

        if (imageInsertError) {
          console.error("Error inserting kit images:", imageInsertError);
        }
      }
    } catch (error) {
      console.error("Error in ensureKitExists:", error);
      // Create minimal kit data if RG data fetch fails
      const { error: insertError } = await supabase
        .from("kits")
        .insert({
          id: numericKitId,
          name_en: `RG Kit ${numericKitId}`,
          grade: "RG",
          scale: "1/144"
        });

      if (insertError) throw insertError;
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
export async function getUserKitRating(kitId: string) {
  const supabase = createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('ratings')
    .select('rating')
    .eq('kit_id', kitId)
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user rating:', error);
  }

  return data ? data.rating : null;
}

export async function addRating(kitId: string, rating: number) {
  const supabase = createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('You must be logged in to rate kits');
  }

  try {
    const numericKitId = getKitId(kitId);

    // Ensure kit exists before adding rating
    await ensureKitExists(numericKitId);

    // Check if user has already rated this kit
    const { data: existingRating, error: checkError } = await supabase
      .from('ratings')
      .select('*')
      .eq('kit_id', numericKitId)
      .eq('user_id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing rating:', checkError);
      throw new Error(`Failed to check existing rating: ${checkError.message}`);
    }

    if (existingRating) {
      // Update existing rating
      const { error: updateError } = await supabase
        .from('ratings')
        .update({ rating })
        .eq('kit_id', numericKitId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating rating:', updateError);
        throw new Error(`Failed to update rating: ${updateError.message}`);
      }
    } else {
      // Insert new rating
      const { error: insertError } = await supabase
        .from('ratings')
        .insert({ kit_id: numericKitId, user_id: user.id, rating });

      if (insertError) {
        console.error('Error adding rating:', insertError);
        throw new Error(`Failed to add rating: ${insertError.message}`);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while rating the kit');
  }
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

// Profile functions
export async function getUserWantedList(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("wanted_list")
    .select(`
      *,
      kit:kits(
        id,
        name_en,
        name_jp,
        grade,
        scale,
        product_image,
        kit_images(image_url)
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getUserActivity(userId: string) {
  const supabase = createClient();

  // Get recent ratings
  const { data: ratings, error: ratingsError } = await supabase
    .from("ratings")
    .select(`
      *,
      kit:kits(
        id,
        name_en,
        grade,
        product_image
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (ratingsError) throw ratingsError;

  // Get recent comments
  const { data: comments, error: commentsError } = await supabase
    .from("comments")
    .select(`
      *,
      kit:kits(
        id,
        name_en,
        grade
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (commentsError) throw commentsError;

  return {
    ratings,
    comments,
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

  try {
    // First try to ensure kit exists
    try {
      await ensureKitExists(numericKitId);
    } catch (error) {
      console.error('Error ensuring kit exists:', error);
      throw new Error('Unable to add to wishlist: Could not fetch kit data');
    }

    // Then try to add to wishlist
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
      console.error('Database error:', error);
      throw new Error('Failed to add to wishlist: Database error');
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
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

// Get top rated kits
export async function getTopRatedKits(limit: number = 5) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('kits')
    .select(`
      *,
      ratings(rating),
      kit_images(image_url)
    `);

  if (error) {
    console.error('Error fetching top rated kits:', error);
    throw error;
  }

  // Calculate average rating for each kit
  const kitsWithRatings = data
    .map(kit => {
      const ratings = (kit.ratings || []) as { rating: number }[];
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;
      const imageUrl = kit.kit_images?.[0]?.image_url || kit.product_image;
      
      return {
        ...kit,
        averageRating: avgRating,
        ratingCount: ratings.length,
        imageUrl
      };
    })
    .filter(kit => kit.ratingCount > 0) // Only include kits with ratings
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, limit);

  return kitsWithRatings;
}

// Get most recently added kits
export async function getRecentKits(limit: number = 5) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('kits')
    .select(`
      *,
      kit_images(image_url)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent kits:', error);
    throw error;
  }

  return data.map(kit => ({
    ...kit,
    imageUrl: kit.kit_images?.[0]?.image_url || kit.product_image
  }));
}
