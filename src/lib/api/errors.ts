/**
 * SMS CNM — Error handling
 * Jerarquía de errores tipados para toda la plataforma.
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly status?: number;
  public readonly details?: unknown;

  constructor(message: string, code = "app_error", status?: number, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class ApiError extends AppError {
  constructor(message: string, status: number, code = "api_error", details?: unknown) {
    super(message, code, status, details);
    this.name = "ApiError";
  }
}

export class NetworkError extends AppError {
  constructor(message = "Network error", details?: unknown) {
    super(message, "network_error", undefined, details);
    this.name = "NetworkError";
  }
}

export class AuthError extends AppError {
  constructor(message = "Unauthorized", status = 401, details?: unknown) {
    super(message, "auth_error", status, details);
    this.name = "AuthError";
  }
}

export class PermissionError extends AppError {
  constructor(message = "Forbidden", details?: unknown) {
    super(message, "permission_error", 403, details);
    this.name = "PermissionError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(message, "validation_error", 422, details);
    this.name = "ValidationError";
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
