type InstantAdminErrorBody = {
  message?: string;
  type?: string;
};

type InstantAdminApiErrorLike = Error & {
  body?: InstantAdminErrorBody;
  status?: number;
};

type AccountDeletionAdminFailureCode =
  | 'admin_query_failed'
  | 'admin_write_failed';

type AccountDeletionAdminErrorResponse = {
  body: {
    error:
      | AccountDeletionAdminFailureCode
      | 'server_schema_misconfigured'
      | 'unexpected_server_error';
    message: string;
  };
  status: number;
};

function extractAdminErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'body' in error &&
    error.body &&
    typeof error.body === 'object' &&
    'message' in error.body &&
    typeof error.body.message === 'string' &&
    error.body.message.trim().length > 0
  ) {
    return error.body.message.trim();
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim();
  }

  return 'unknown_error';
}

function extractAdminErrorType(error: unknown): string | null {
  if (
    error &&
    typeof error === 'object' &&
    'body' in error &&
    error.body &&
    typeof error.body === 'object' &&
    'type' in error.body &&
    typeof error.body.type === 'string' &&
    error.body.type.trim().length > 0
  ) {
    return error.body.type.trim().toLowerCase();
  }

  return null;
}

export function isLikelyAccountDeletionSchemaError(error: unknown): boolean {
  const errorType = extractAdminErrorType(error);
  if (errorType === 'attr-not-found' || errorType === 'entity-not-found') {
    return true;
  }

  const message = extractAdminErrorMessage(error).toLowerCase();

  return (
    (message.includes('attribute') && message.includes('not found')) ||
    (message.includes('attr') && message.includes('not found')) ||
    (message.includes('entity') && message.includes('not found')) ||
    (message.includes('account_deletion_requests') &&
      (message.includes('not found') || message.includes('unknown')))
  );
}

export function buildAccountDeletionAdminErrorResponse(params: {
  context: Record<string, unknown>;
  error: unknown;
  failureCode: AccountDeletionAdminFailureCode;
  operation: string;
}): AccountDeletionAdminErrorResponse {
  const isSchemaError = isLikelyAccountDeletionSchemaError(params.error);
  const message = extractAdminErrorMessage(params.error);

  console.error(`[account-deletion] ${params.operation} failed`, {
    ...params.context,
    error: params.error,
    message,
    type: extractAdminErrorType(params.error),
  });

  if (isSchemaError) {
    return {
      body: {
        error: 'server_schema_misconfigured',
        message: 'Account deletion schema is missing or outdated on the server',
      },
      status: 503,
    };
  }

  if (params.error instanceof Error) {
    const errorWithStatus = params.error as InstantAdminApiErrorLike;
    if (
      typeof errorWithStatus.status === 'number' &&
      errorWithStatus.status >= 500
    ) {
      return {
        body: {
          error: 'unexpected_server_error',
          message,
        },
        status: 500,
      };
    }
  }

  return {
    body: {
      error: params.failureCode,
      message,
    },
    status: 500,
  };
}
