import { createClient } from "@/utils/supabase/server";
import { ensureUserProfile } from "@/utils/supabase/ensure-profile";
import { getUserWantedList, getUserActivity } from "@/utils/supabase/kit-interactions";
import { ProfileHeader } from "@/components/profile/profile-header";
import { WishlistSection } from "@/components/profile/wishlist-section";
import { ActivitySection } from "@/components/profile/activity-section";
import { handleRemoveFromWishlist, handleRefreshKit } from "./actions";

// Mark this page as dynamic
export const dynamic = 'force-dynamic';

interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export default async function ProfilePage() {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="text-red-600">{userError.message}</p>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Not Logged In</h1>
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  // Ensure profile exists and get profile data
  const result = await ensureUserProfile(supabase);
  
  if ('error' in result && result.error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Profile Error</h1>
        <div className="bg-red-50 border border-red-200 p-4 rounded mb-4">
          <h2 className="font-bold text-red-800 mb-2">Error Details:</h2>
          <p className="text-red-700">{result.error}</p>
          {result.details && (
            <pre className="mt-2 p-2 bg-red-100 rounded text-sm overflow-auto">
              {JSON.stringify(result.details, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  }

  const profile = result.profile as UserProfile;
  if (!profile) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Profile Error</h1>
        <p className="text-red-600">Profile data not found</p>
      </div>
    );
  }

  // Fetch profile data
  const [wantedList, activity] = await Promise.all([
    getUserWantedList(user.id),
    getUserActivity(user.id)
  ]);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <ProfileHeader
        profile={profile}
        isOwnProfile={true}
        userEmail={user.email}
      />
      
      <WishlistSection
        items={wantedList}
        isOwnProfile={true}
        onRemoveFromWishlist={handleRemoveFromWishlist}
        onRefreshKit={handleRefreshKit}
      />
      
      <ActivitySection
        ratings={activity.ratings}
        comments={activity.comments}
      />
    </div>
  );
}