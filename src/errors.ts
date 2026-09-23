/**
 * Base error class for app update errors
 */
export class AppUpdateError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "AppUpdateError";
    Object.setPrototypeOf(this, AppUpdateError.prototype);
  }
}

/**
 * Error thrown when update check fails
 */
export class UpdateCheckError extends AppUpdateError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "UpdateCheckError";
    Object.setPrototypeOf(this, UpdateCheckError.prototype);
  }
}

/**
 * Error thrown when APK download fails
 */
export class DownloadError extends AppUpdateError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "DownloadError";
    Object.setPrototypeOf(this, DownloadError.prototype);
  }
}

/**
 * Error thrown when APK installation fails
 */
export class InstallationError extends AppUpdateError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "InstallationError";
    Object.setPrototypeOf(this, InstallationError.prototype);
  }
}

/**
 * Error thrown when network request fails
 */
export class NetworkError extends AppUpdateError {
  constructor(message: string, public readonly statusCode?: number, cause?: unknown) {
    super(message, cause);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Error thrown when response validation fails
 */
export class ValidationError extends AppUpdateError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
