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

    // Find the display name field (it might have a prefix like 1_displayName)
    const displayNameField = Array.from(formData.keys()).find(key => key.endsWith('displayName'));
    const avatarField = Array.from(formData.keys()).find(key => key.endsWith('avatar'));
    
    if (!displayNameField) {
      throw new Error('Display name field not found in form data');
    }

    const displayName = formData.get(displayNameField) as string;
    const avatarFile = avatarField ? formData.get(avatarField) as File : null;
    let avatarUrl = null;
    
    // If a new avatar file was provided and it's not empty
    if (avatarFile && avatarFile.size > 0) {
      // Get file extension
      const fileExt = avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `avatars/${user.id}.${fileExt}`;

      // List existing avatars to delete
      const { data: existingFiles } = await supabase.storage
        .from('profiles')
        .list('avatars', {
          limit: 1,
          search: user.id
        });

      // Delete old avatar if it exists
      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage
          .from('profiles')
          .remove([`avatars/${existingFiles[0].name}`]);
      }
      
      // Upload the new avatar with owner info
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, avatarFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: avatarFile.type,
          duplex: 'half'
        });

      if (uploadError) {
        console.error('Upload error:', {
          error: uploadError,
          fileName,
          userId: user.id,
          fileSize: avatarFile.size,
          fileType: avatarFile.type
        });
        throw uploadError;
      }

      if (uploadError) throw uploadError;

      // Get the public URL (use the same path as upload)
      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      if (!urlData) {
        throw new Error('Failed to get avatar URL');
      }

      avatarUrl = urlData.publicUrl;

      // Log success for debugging
      console.log('Avatar upload success:', {
        fileName,
        publicUrl: avatarUrl
      });
    }

    // Get current profile to verify it exists
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select()
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', {
        error: profileError,
        userId: user.id
      });
      throw profileError;
    }

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Update profile with debugging
    const { data: updateData, error: updateError } = await supabase
      .from("user_profiles")
      .update({
        display_name: displayName,
        ...(avatarUrl && { avatar_url: avatarUrl }),
      })
      .eq("id", user.id)
      .select();

    if (updateError) {
      console.error('Profile update error:', {
        error: updateError,
        userId: user.id,
        currentProfile: profile,
        updateData: {
          display_name: displayName,
          avatar_url: avatarUrl
        }
      });
      throw updateError;
    }

    // Revalidate the page to refresh the data
    revalidatePath('/profile');
    return { success: true, avatarUrl };
  } catch (error: any) {
    let userInfo;
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      userInfo = data.user?.id;
    } catch (authError) {
      console.error('Failed to get user info in error handler:', authError);
    }

    // Log detailed error information
    console.error('Profile update error details:', {
      error,
      errorMessage: error.message,
      errorCode: error.code,
      details: error.details,
      hint: error.hint,
      formDataKeys: Array.from(formData.keys()),
      userId: userInfo,
      supabaseErrorCode: error?.statusCode
    });
    
    // Throw a more informative error
    throw new Error(`Failed to update profile: ${error.message || 'Unknown error'} (Code: ${error?.statusCode || 'unknown'})`);
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