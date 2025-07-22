'use client';

import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: 'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
          description: 'text-sm opacity-90',
          actionButton: 'bg-zinc-900 text-zinc-50',
          cancelButton: 'bg-white text-zinc-900',
          closeButton: 'bg-white text-zinc-900',
        },
      }}
      richColors
      closeButton
    />
  );
}