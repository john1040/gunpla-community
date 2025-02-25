'use client';

import { useTransition } from 'react';

interface RefreshKitButtonProps {
  kitId: string;
  onRefresh: (kitId: string) => Promise<void>;
}

export function RefreshKitButton({ kitId, onRefresh }: RefreshKitButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        startTransition(() => {
          onRefresh(kitId);
        });
      }}
      disabled={isPending}
      className={`px-3 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors ${
        isPending ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {isPending ? 'Refreshing...' : 'Refresh Data'}
    </button>
  );
}