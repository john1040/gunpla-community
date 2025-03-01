'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { updateProfile } from '@/app/profile/actions';
import { useToast } from "@/components/ui/use-toast";

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
  const [isOpen, setIsOpen] = useState(false);
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(profile.avatar_url || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleAvatarClick = () => {
    if (isOwnProfile && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setAvatarFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.currentTarget);
      if (avatarFile) {
        formData.set('avatar', avatarFile);
      }
      const result = await updateProfile(formData);
      setIsOpen(false);
      if (result.avatarUrl) {
        setPreviewUrl(result.avatarUrl);
      }
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-[#FFFFFF] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 mb-6">
      <div className="flex items-center gap-6">
        <div 
          className={`w-24 h-24 overflow-hidden bg-gray-200 border-[3px] border-black ${isOwnProfile ? 'cursor-pointer hover:opacity-80' : ''}`}
          onClick={handleAvatarClick}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            aria-label="Upload avatar"
          />
        </div>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-2">
            {profile.display_name || 'Anonymous User'}
          </h1>
          
          <div className="text-sm text-gray-600">
            <p>Member since {new Date(profile.created_at).toISOString().split('T')[0]}</p>
            {isOwnProfile && userEmail && (
              <p className="mt-1">{userEmail}</p>
            )}
          </div>
        </div>

        {isOwnProfile && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <button
                className="px-6 py-3 bg-[#FFE500] text-black font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                Edit Profile
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <label htmlFor="displayName" className="block text-base font-bold text-black mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    defaultValue={profile.display_name || ''}
                    className="w-full border-[3px] border-black px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:border-[#FFE500] transition-all"
                    placeholder="Enter your display name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">
                    Avatar
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 overflow-hidden bg-gray-200 border-[3px] border-black">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8"
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
                    <button
                      type="button"
                      onClick={handleAvatarClick}
                      className="px-4 py-2 bg-[#57FFC9] text-black font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      Choose Image
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
                  </p>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 bg-white text-black font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#FFE500] text-black font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
