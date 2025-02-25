interface ProfileHeaderProps {
  profile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    created_at: string;
  };
  isOwnProfile: boolean;
  userEmail?: string | null;
}

export function ProfileHeader({ profile, isOwnProfile, userEmail }: ProfileHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={`${profile.display_name || 'User'}'s avatar`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-2">
            {profile.display_name || 'Anonymous User'}
          </h1>
          
          <div className="text-sm text-gray-600">
            <p>Member since {new Date(profile.created_at).toLocaleDateString()}</p>
            {isOwnProfile && userEmail && (
              <p className="mt-1">{userEmail}</p>
            )}
          </div>
        </div>

        {isOwnProfile && (
          <button
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
}