'use client';

import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useTranslationClient } from '@/hooks/use-translation-client';
import { useParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mutations } from '@/utils/queries';

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

interface UpdateProfileResult {
  success: boolean;
  avatarUrl?: string;
}

export function ProfileHeader({ profile, isOwnProfile, userEmail }: ProfileHeaderProps) {
  const params = useParams();
  const locale = params.locale as string;
  const { t } = useTranslationClient(locale);
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(profile.avatar_url || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const updateProfileMutation = useMutation<UpdateProfileResult, Error, FormData>({
    ...mutations.updateProfile,
    onSuccess: (result) => {
      setIsOpen(false);
      if (result.avatarUrl) {
        setPreviewUrl(result.avatarUrl);
      }
      // Invalidate profile queries to update data everywhere
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast({
        title: t('profile.success.updated'),
        description: t('profile.success.updateMessage')
      });
    },
    onError: (error) => {
      toast({
        title: t('profile.error.title'),
        description: t('profile.error.updateFailed'),
        variant: "destructive"
      });
    }
  });

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
          title: t('profile.error.fileTooLarge'),
          description: t('profile.error.fileSizeLimit'),
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: t('profile.error.invalidFileType'),
          description: t('profile.error.selectImageFile'),
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
    const formData = new FormData(e.currentTarget);
    if (avatarFile) {
      formData.set('avatar', avatarFile);
    }
    updateProfileMutation.mutate(formData);
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
              alt={`${profile.display_name || t('profile.anonymous')}'s avatar`}
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
            aria-label={t('profile.uploadAvatar')}
          />
        </div>
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-2">
            {profile.display_name || t('profile.anonymous')}
          </h1>
          
          <div className="text-sm text-gray-600">
            <p>{t('profile.memberSince', { date: new Date(profile.created_at).toISOString().split('T')[0] })}</p>
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
                {t('profile.editProfile')}
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('profile.editProfile')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <label htmlFor="displayName" className="block text-base font-bold text-black mb-2">
                    {t('profile.displayName')}
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    defaultValue={profile.display_name || ''}
                    className="w-full border-[3px] border-black px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:border-[#FFE500] transition-all"
                    placeholder={t('profile.enterDisplayName')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-base font-bold text-black mb-2">
                    {t('profile.avatar')}
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 overflow-hidden bg-gray-200 border-[3px] border-black">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt={t('profile.avatarPreview')}
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
                      className="px-4 py-2 bg-[#57FFC9] text-black font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={updateProfileMutation.isPending}
                    >
                      {t('profile.chooseImage')}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('profile.imageRequirements')}
                  </p>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 bg-white text-black font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={updateProfileMutation.isPending}
                  >
                    {t('actions.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#FFE500] text-black font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('profile.saving')}
                      </>
                    ) : (
                      t('profile.saveChanges')
                    )}
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
