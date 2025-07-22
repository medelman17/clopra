import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  
  // Replay configuration
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  
  integrations: [
    Sentry.replayIntegration({
      // Mask all text and media content by default
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Filter out certain errors
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    
    // Filter out specific errors
    const error = hint.originalException;
    if (error instanceof Error) {
      // Filter out network errors that are expected
      if (error.message?.includes('Failed to fetch')) {
        return null;
      }
    }
    
    return event;
  },
});