import { AppUpdateResponse } from "../types";
import { ValidationError } from "../errors";

/**
 * Validates that a URL is properly formatted and uses HTTPS
 */
export function validateUrl(url: string, fieldName: string = "URL"): void {
  if (!url || typeof url !== "string") {
    throw new ValidationError(`${fieldName} is required and must be a string`);
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new ValidationError(`${fieldName} must use HTTP or HTTPS protocol`);
    }
  } catch (error) {
    throw new ValidationError(`${fieldName} is not a valid URL: ${url}`, error);
  }
}

/**
 * Validates the backend response structure
 */
export function validateUpdateResponse(data: unknown): AppUpdateResponse {
  if (!data || typeof data !== "object") {
    throw new ValidationError("Response must be an object");
  }

  const response = data as Record<string, unknown>;

  // Validate updateAvailable field
  if (typeof response.updateAvailable !== "boolean") {
    throw new ValidationError(
      "Response must contain 'updateAvailable' as a boolean"
    );
  }

  // If update is available, validate required fields
  if (response.updateAvailable) {
    if (response.downloadUrl && typeof response.downloadUrl !== "string") {
      throw new ValidationError("'downloadUrl' must be a string");
    }

    if (response.latestVersion && typeof response.latestVersion !== "string") {
      throw new ValidationError("'latestVersion' must be a string");
    }

    if (response.mandatory !== undefined && typeof response.mandatory !== "boolean") {
      throw new ValidationError("'mandatory' must be a boolean");
    }

    if (response.websiteUrl && typeof response.websiteUrl !== "string") {
      throw new ValidationError("'websiteUrl' must be a string");
    }

    // Validate URLs if present
    if (response.downloadUrl) {
      validateUrl(response.downloadUrl as string, "downloadUrl");
    }

    if (response.websiteUrl) {
      validateUrl(response.websiteUrl as string, "websiteUrl");
    }
  }

  return response as AppUpdateResponse;
}

/**
 * Validates app update configuration
 */
export function validateConfig(config: {
  apiUrl: string;
  version: string;
  buildType: string;
  projectName: string;
  packageName: string;
}): void {
  if (!config.apiUrl) {
    throw new ValidationError("apiUrl is required");
  }
  validateUrl(config.apiUrl, "apiUrl");

  if (!config.version || typeof config.version !== "string") {
    throw new ValidationError("version is required and must be a string");
  }

  if (!config.buildType || typeof config.buildType !== "string") {
    throw new ValidationError("buildType is required and must be a string");
  }

  if (!config.projectName || typeof config.projectName !== "string") {
    throw new ValidationError("projectName is required and must be a string");
  }

  if (!config.packageName || typeof config.packageName !== "string") {
    throw new ValidationError("packageName is required and must be a string");
  }
}
