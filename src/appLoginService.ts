import { AppLoginError, NetworkError, ValidationError } from "./errors";

export interface CreateAppLoginParams {
  ip_address: string;
  country: string;
  downloaded_by: string;
  device_id: string;
  longitude: string;
  latitude: string;
  app_product_id?: number;
  app_version: string;
  app_package_name?: string;
}

export interface CreateAppLoginOptions {
  bearerToken?: string;
}

export interface AppLoginResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  [key: string]: unknown;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

export async function createAppLogin(
  baseUrl: string,
  params: CreateAppLoginParams,
  options: CreateAppLoginOptions = {},
): Promise<AppLoginResponse> {
  const url = `${normalizeBaseUrl(baseUrl)}/app-login/create`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.bearerToken) {
    headers["Authorization"] = `Bearer ${options.bearerToken}`;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new NetworkError(
        `App login creation failed with status ${response.status}`,
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

    return data as AppLoginResponse;
  } catch (error) {
    if (error instanceof NetworkError || error instanceof ValidationError) {
      throw error;
    }
    throw new AppLoginError("Failed to create app login record", error);
  }
}
