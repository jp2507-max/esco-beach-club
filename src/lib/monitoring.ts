import * as Sentry from '@sentry/react-native';

type MonitoringContext = {
  contexts?: Record<string, Record<string, unknown>>;
  extras?: Record<string, unknown>;
  tags?: Record<string, string>;
};

function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);
  return new Error('unknown_error');
}

export function captureHandledError(
  error: unknown,
  context: MonitoringContext = {}
): void {
  Sentry.captureException(normalizeError(error), {
    contexts: context.contexts,
    level: 'error',
    extra: context.extras,
    tags: context.tags,
  });
}

export function addMonitoringBreadcrumb(params: {
  category: string;
  data?: Record<string, unknown>;
  level?: 'error' | 'info' | 'warning';
  message: string;
}): void {
  Sentry.addBreadcrumb({
    category: params.category,
    data: params.data,
    level: params.level ?? 'info',
    message: params.message,
  });
}
