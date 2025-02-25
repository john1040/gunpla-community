'use client';

import { useTransition } from 'react';

interface RemoveWishlistButtonProps {
  kitId: string;
  onRemove: (kitId: string) => Promise<any>;
}

export function RemoveWishlistButton({ kitId, onRemove }: RemoveWishlistButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        startTransition(async () => {
          try {
            // Call the server action
            await onRemove(kitId);
            
            // Find the closest parent item container and hide it (optimistic UI)
            const itemElement = document.querySelector(`[data-kit-id="${kitId}"]`);
            if (itemElement) {
              itemElement.classList.add('opacity-50', 'pointer-events-none');
              // Add a transition effect
              setTimeout(() => {
                itemElement.classList.add('hidden');
              }, 300);
            }
          } catch (error) {
            console.error('Failed to remove item:', error);
          }
        });
      }}
      disabled={isPending}
      className={`w-full px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors ${
        isPending ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {isPending ? 'Removing...' : 'Remove from Wishlist'}
    </button>
  );
}