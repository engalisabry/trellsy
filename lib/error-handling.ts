import { ErrorCategory } from '@/types';
import { toast } from 'sonner';

export interface AppError extends Error {
  category: ErrorCategory;
  statusCode?: number;
  originalError?: unknown;
  context?: Record<string, unknown>;
}

export function createAppError(
  message: string,
  category: ErrorCategory = 'unknown',
  options?: {
    statusCode?: number;
    originalError?: unknown;
    context?: Record<string, unknown>;
  },
): AppError {
  const error = new Error(message) as AppError;
  error.name = 'AppError';
  error.category = category;
  error.statusCode = options?.statusCode;
  error.originalError = options?.originalError;
  error.context = options?.context;
  return error;
}

/**
 * Categorize errors based on their characteristics
 */
export function categorizeError(error: unknown): ErrorCategory {
  if (!error) return 'unknown';

  if (isAppError(error)) {
    return error.category;
  }

  if (isSupabaseError(error)) {
    const pgError = error as { code?: string; message?: string };

    if (
      pgError.message?.includes('JWT') ||
      pgError.message?.includes('auth') ||
      pgError.message?.includes('not authenticated') ||
      pgError.code === '401'
    ) {
      return 'auth';
    }

    if (
      pgError.message?.includes('permission') ||
      pgError.message?.toLowerCase().includes('access denied') ||
      pgError.message?.includes('violates row-level security') ||
      pgError.code === '403'
    ) {
      return 'permission';
    }

    // Validation errors - usually constraint violations
    if (
      pgError.code?.startsWith('23') ||
      pgError.message?.includes('violates') ||
      pgError.message?.includes('constraint') ||
      pgError.code === '422'
    ) {
      return 'validation';
    }

    // Not found errors
    if (pgError.code === '404' || pgError.message?.includes('not found')) {
      return 'notFound';
    }

    // Database errors
    if (pgError.code?.startsWith('08') || pgError.code?.startsWith('XX')) {
      return 'database';
    }
  }

  // Check for network errors
  if (error instanceof Error) {
    if (
      error.message.includes('network') ||
      error.message.includes('connection') ||
      error.message.includes('offline') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('timeout')
    ) {
      return 'network';
    }
  }

  return 'unknown';
}

/**
 * Check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'category' in error &&
    error instanceof Error
  );
}

/**
 * Check if an error is from Supabase
 */
export function isSupabaseError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;

  return (
    'code' in error ||
    'message' in error ||
    'details' in error ||
    'hint' in error
  );
}

/**
 * Get a user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (isSupabaseError(error) && typeof error === 'object' && error !== null) {
    if ('message' in error && typeof error.message === 'string') {
      if (error.message.includes('duplicate key')) {
        return 'This resource already exists. Please try a different name or identifier.';
      }

      if (error.message.includes('violates row-level security')) {
        return "You don't have permission to perform this action.";
      }

      return error.message;
    }
  }

  return 'An unexpected error occurred';
}

/**
 * Handle errors with appropriate logging and user feedback
 */
export function handleError(
  error: unknown,
  options?: {
    defaultMessage?: string;
    showToast?: boolean;
    throwError?: boolean;
    context?: Record<string, unknown>;
  },
): AppError {
  const defaultMessage =
    options?.defaultMessage || 'An unexpected error occurred';
  const showToast = options?.showToast ?? true;
  const throwError = options?.throwError ?? false;

  const category = categorizeError(error);

  const appError = createAppError(
    getUserFriendlyErrorMessage(error) || defaultMessage,
    category,
    {
      originalError: error,
      context: options?.context,
    },
  );

  if (showToast) {
    showErrorToast(appError);
  }

  if (throwError) {
    throw appError;
  }

  return appError;
}

/**
 * Show an appropriate toast message based on error category
 */
export function showErrorToast(error: AppError | unknown): void {
  const appError = isAppError(error)
    ? error
    : handleError(error, { showToast: false });

  switch (appError.category) {
    case 'auth':
      toast.error('Authentication error: ' + appError.message, {
        description: 'Please sign in again or refresh the page.',
        duration: 5000,
      });
      break;

    case 'permission':
      toast.error('Permission denied: ' + appError.message, {
        description: 'You do not have access to perform this action.',
        duration: 5000,
      });
      break;

    case 'validation':
      toast.error('Validation error: ' + appError.message, {
        description: 'Please check your input and try again.',
        duration: 5000,
      });
      break;

    case 'notFound':
      toast.error('Not found: ' + appError.message, {
        description: 'The requested resource could not be found.',
        duration: 4000,
      });
      break;

    case 'network':
      toast.error('Network error: ' + appError.message, {
        description: 'Please check your internet connection and try again.',
        duration: 5000,
      });
      break;

    case 'database':
      toast.error('Database error: ' + appError.message, {
        description: 'There was a problem with the database operation.',
        duration: 5000,
      });
      break;

    default:
      toast.error(appError.message, {
        description: 'An unexpected error occurred. Please try again later.',
        duration: 4000,
      });
  }
}
