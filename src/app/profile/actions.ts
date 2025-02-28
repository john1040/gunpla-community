'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ensureKitExists } from "@/utils/supabase/kit-interactions";

export async function updateProfile(formData: FormData) {
  try {
    const supabase = await createClient();
    
    // Verify session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("Must be logged in to update profile");
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Could not get user data");
    }

    const displayName = formData.get('displayName') as string;
    const avatarFile = formData.get('avatar') as File;
    let avatarUrl = null;
    
    // If a new avatar file was provided and it's not empty
    if (avatarFile && avatarFile.size > 0) {
      // Delete the old avatar if it exists
      const oldAvatarPath = `avatars/${user.id}`;
      await supabase.storage.from('profiles').remove([oldAvatarPath]);
      
      // Upload the new avatar
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(`avatars/${user.id}`, avatarFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(`avatars/${user.id}`);

      avatarUrl = urlData.publicUrl;
    }

    // Update profile
    const { error } = await supabase
      .from("user_profiles")
      .update({
        display_name: displayName,
        ...(avatarUrl && { avatar_url: avatarUrl }),
      })
      .eq("id", user.id);

    if (error) throw error;
    
    // Revalidate the page to refresh the data
    revalidatePath('/profile');
    return { success: true, avatarUrl };
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

export async function handleRemoveFromWishlist(kitId: string) {
  try {
    const supabase = await createClient();
    
    // Verify session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("Must be logged in to remove from wishlist");
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Could not get user data");
    }

    // Remove from wishlist
    const { error } = await supabase
      .from("wanted_list")
      .delete()
      .eq("kit_id", kitId)
      .eq("user_id", user.id);

    if (error) throw error;
    
    // Revalidate the page to refresh the data
    revalidatePath('/profile');
    return { success: true };
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    throw new Error('Failed to remove from wishlist');
  }
}

export async function handleRefreshKit(kitId: string) {
  try {
    const supabase = await createClient();
    
    // Verify session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("Must be logged in to refresh kit");
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Could not get user data");
    }

    // Delete kit and its images
    await Promise.all([
      supabase.from("kit_images").delete().eq("kit_id", kitId),
      supabase.from("kits").delete().eq("id", kitId)
    ]);

    // Re-create kit with fresh data
    await ensureKitExists(kitId);
  } catch (error) {
    console.error('Error refreshing kit:', error);
    throw new Error('Failed to refresh kit');
  }
}