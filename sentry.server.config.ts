import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  
  // Custom error filtering for server
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    
    // Add more context for Prisma errors
    if (event.exception?.values?.[0]?.type?.includes('PrismaClient')) {
      event.fingerprint = ['database', event.exception.values[0].type];
      event.tags = {
        ...event.tags,
        database: 'prisma',
      };
    }
    
    // Filter out expected errors
    const error = hint.originalException;
    if (error instanceof Error) {
      // Don't log expected validation errors
      if (error.name === 'ZodError') {
        return null;
      }
    }
    
    return event;
  },
});