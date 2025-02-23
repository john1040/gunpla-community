import { createClient } from "@/utils/supabase/server";
import { ensureUserProfile } from "@/utils/supabase/ensure-profile";
import { User } from "@supabase/supabase-js";

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
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">User Information:</h2>
          <DisplayUserInfo user={user} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">User Information:</h2>
        <pre className="overflow-auto">
          {JSON.stringify({ 
            profile: result.profile,
            user: {
              id: user.id,
              email: user.email,
              metadata: user.user_metadata
            }
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function DisplayUserInfo({ user }: { user: User }) {
  return (
    <pre className="overflow-auto">
      {JSON.stringify({ 
        userId: user.id, 
        email: user.email,
        metadata: user.user_metadata 
      }, null, 2)}
    </pre>
  );
}