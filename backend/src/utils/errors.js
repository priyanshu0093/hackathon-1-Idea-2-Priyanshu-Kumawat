/**
 * Application Error classes for structured, operational error handling
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ProviderUnconfiguredError extends AppError {
  constructor(
    message = 'Live flight search is unavailable because Amadeus API credentials are not configured. Configure AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in backend/.env, or switch to Demo Mode to explore sample flight hacks.'
  ) {
    super(message, 503, 'PROVIDER_UNCONFIGURED');
  }
}

export class ProviderTimeoutError extends AppError {
  constructor(message = 'Flight search request to upstream provider timed out.') {
    super(message, 504, 'PROVIDER_TIMEOUT');
  }
}

export class ProviderRateLimitError extends AppError {
  constructor(message = 'Upstream flight provider rate limit exceeded. Please try again shortly.') {
    super(message, 429, 'PROVIDER_RATE_LIMIT');
  }
}

export class ProviderError extends AppError {
  constructor(message = 'Upstream flight provider returned an error.') {
    super(message, 502, 'PROVIDER_ERROR');
  }
}
