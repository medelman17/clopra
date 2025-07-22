import * as Sentry from "@sentry/nextjs";

/**
 * Track ordinance-related errors with proper context
 */
export const trackOrdinanceError = (
  municipality: string,
  operation: 'scrape' | 'process' | 'analyze' | 'generate',
  error: Error
) => {
  Sentry.captureException(error, {
    tags: {
      municipality,
      operation,
      feature: 'ordinance',
    },
    contexts: {
      ordinance: {
        municipality,
        operation,
        timestamp: new Date().toISOString(),
      },
    },
  });
};

/**
 * Track PDF generation performance and errors
 */
export const trackPDFGeneration = (
  requestId: string,
  municipality: string,
  duration: number,
  success: boolean
) => {
  Sentry.addBreadcrumb({
    message: 'PDF Generation',
    category: 'pdf',
    level: success ? 'info' : 'error',
    data: {
      requestId,
      municipality,
      duration,
      success,
    },
  });
  
  if (success) {
    // Add performance data to context
    Sentry.setContext('pdf_generation', {
      duration,
      municipality,
      success: true,
    });
  }
};

/**
 * Track Tavily API performance
 */
export const trackTavilyOperation = async <T>(
  operation: string,
  municipality: string,
  fn: () => Promise<T>
): Promise<T> => {
  return Sentry.startSpan(
    { 
      name: `tavily.${operation}`,
      op: 'http.client',
      attributes: {
        municipality,
        operation,
      }
    },
    async () => {
      try {
        const result = await fn();
        return result;
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            service: 'tavily',
            operation,
            municipality,
          },
        });
        throw error;
      }
    }
  );
};

/**
 * Track AI operations performance
 */
export const trackAIOperation = async <T>(
  operation: 'analyze' | 'generate' | 'embed',
  model: string,
  fn: () => Promise<T>
): Promise<T> => {
  return Sentry.startSpan(
    { 
      name: `ai.${operation}`,
      op: 'ai',
      attributes: {
        'ai.model': model,
        'ai.operation': operation,
      }
    },
    async () => {
      const startTime = Date.now();
      try {
        const result = await fn();
        const duration = Date.now() - startTime;
        
        // Add performance data to context
        Sentry.setContext('ai_operation', {
          operation,
          model,
          duration,
        });
        
        return result;
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            service: 'ai',
            operation,
            model,
          },
        });
        throw error;
      }
    }
  );
};

/**
 * Track database operations (in addition to Prisma integration)
 */
export const trackDatabaseOperation = async <T>(
  operation: string,
  table: string,
  fn: () => Promise<T>
): Promise<T> => {
  return Sentry.startSpan(
    { 
      name: `db.${operation}`,
      op: 'db',
      attributes: {
        'db.table': table,
        'db.operation': operation,
      }
    },
    fn
  );
};

/**
 * Create a transaction for multi-step operations
 */
export const createTransaction = async <T>(
  name: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  return Sentry.startSpan(
    {
      name,
      op: operation,
    },
    fn
  );
};

/**
 * Add user context for better error tracking
 */
export const setUserContext = (userId?: string, email?: string) => {
  if (userId || email) {
    Sentry.setUser({
      id: userId,
      email,
    });
  } else {
    Sentry.setUser(null);
  }
};

/**
 * Track feature usage
 */
export const trackFeatureUsage = (
  feature: string,
  metadata?: Record<string, unknown>
) => {
  Sentry.addBreadcrumb({
    message: `Feature used: ${feature}`,
    category: 'feature',
    level: 'info',
    data: metadata,
  });
  
  // Track feature usage as breadcrumb for now
  // Metrics API not available in current version
};