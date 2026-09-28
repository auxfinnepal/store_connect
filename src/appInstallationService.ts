import { NetworkError, ValidationError, AppInstallationError } from "./errors";

export interface CreateAppInstallationParams {
  ip_address: string;
  country: string;
  downloaded_by: string;
  device_id: string;
  longitude: number;
  latitude: number;
  app_product_id: number;
}

export interface AppInstallationResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  [key: string]: unknown;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

export async function createAppInstallation(
  baseUrl: string,
  params: CreateAppInstallationParams,
): Promise<AppInstallationResponse> {
  const url = `${normalizeBaseUrl(baseUrl)}/app-installation/create`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new NetworkError(
        `App installation creation failed with status ${response.status}`,
        response.status,
      );
    }

    const text = await response.text();
    let data: unknown;

    try {
      data = JSON.parse(text);
    } catch (parseError) {
      throw new ValidationError(
        "Server returned invalid JSON response",
        parseError,
      );
    }

    return data as AppInstallationResponse;
  } catch (error) {
    if (error instanceof NetworkError || error instanceof ValidationError) {
      throw error;
    }
    throw new AppInstallationError("Failed to create app installation record", error);
  }
}
