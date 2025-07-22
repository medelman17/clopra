import { toast as sonnerToast } from 'sonner';

// Custom toast types for different operations
export const toast = {
  // Basic toasts
  success: (message: string, description?: string) => {
    return sonnerToast.success(message, {
      description,
    });
  },

  error: (message: string, description?: string) => {
    return sonnerToast.error(message, {
      description,
    });
  },

  warning: (message: string, description?: string) => {
    return sonnerToast.warning(message, {
      description,
    });
  },

  info: (message: string, description?: string) => {
    return sonnerToast.info(message, {
      description,
    });
  },

  // Operation-specific toasts
  loading: (message: string, description?: string) => {
    return sonnerToast.loading(message, {
      description,
    });
  },

  // Scraping operations
  scraping: {
    start: (municipalityName: string) => {
      return sonnerToast.loading('Searching for ordinance...', {
        description: `Scanning ${municipalityName} municipal websites`,
      });
    },
    success: (municipalityName: string) => {
      return sonnerToast.success('Ordinance found!', {
        description: `Successfully scraped ${municipalityName} rent control ordinance`,
      });
    },
    error: (municipalityName: string, error?: string) => {
      return sonnerToast.error('Scraping failed', {
        description: error || `Could not find ordinance for ${municipalityName}`,
      });
    },
  },

  // Processing operations
  processing: {
    start: () => {
      return sonnerToast.loading('Processing ordinance...', {
        description: 'Chunking text and generating embeddings',
      });
    },
    success: (chunks: number) => {
      return sonnerToast.success('Processing complete!', {
        description: `Created ${chunks} searchable chunks`,
      });
    },
    error: (error?: string) => {
      return sonnerToast.error('Processing failed', {
        description: error || 'Failed to process ordinance',
      });
    },
  },

  // OPRA generation
  opra: {
    analyzing: () => {
      return sonnerToast.loading('Analyzing ordinance...', {
        description: 'Identifying relevant record categories',
      });
    },
    generating: () => {
      return sonnerToast.loading('Generating OPRA request...', {
        description: 'Creating comprehensive document request',
      });
    },
    success: () => {
      return sonnerToast.success('OPRA request ready!', {
        description: 'Your request has been generated and is ready to download',
        action: {
          label: 'View',
          onClick: () => {
            // Scroll to OPRA section
            document.querySelector('[data-opra-result]')?.scrollIntoView({ behavior: 'smooth' });
          },
        },
      });
    },
    error: (error?: string) => {
      return sonnerToast.error('Generation failed', {
        description: error || 'Failed to generate OPRA request',
      });
    },
  },

  // File operations
  file: {
    copied: () => {
      return sonnerToast.success('Copied to clipboard!', {
        duration: 2000,
      });
    },
    downloading: () => {
      return sonnerToast.info('Downloading PDF...', {
        duration: 2000,
      });
    },
    exported: (filename: string) => {
      return sonnerToast.success(`Exported ${filename}`, {
        duration: 3000,
      });
    },
  },

  // Promise-based toasts for async operations
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return sonnerToast.promise(promise, messages);
  },

  // Dismiss toasts
  dismiss: (toastId?: string | number) => {
    return sonnerToast.dismiss(toastId);
  },
};

// Export type for extending
export type Toast = typeof toast;