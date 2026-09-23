import { getPlatformAdapterInstance } from "./adapters";
import { downloadAndInstallApk } from "./utils/apk";
import { AppUpdateConfig, AppUpdateResponse } from "./types";
import { validateConfig, validateUpdateResponse } from "./utils/validation";
import { NetworkError, UpdateCheckError, ValidationError } from "./errors";

export interface CheckUpdateParams {
  version: string;
  buildType: string;
  projectName: string;
  packageName: string;
}

export class AppUpdateService {
  private config: AppUpdateConfig;
  private downloadingRef: { current: boolean } = { current: false };

  constructor(config: AppUpdateConfig) {
    // Validate configuration on construction
    validateConfig(config);
    this.config = config;
  }

  async checkForUpdate(): Promise<AppUpdateResponse> {
    const params: CheckUpdateParams = {
      version: this.config.version,
      buildType: this.config.buildType,
      projectName: this.config.projectName,
      packageName: this.config.packageName,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(this.config.requestHeaders || {}),
    };

    try {
      const response = await fetch(this.config.apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new NetworkError(
          `Update check failed with status ${response.status}`,
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

      // Validate response structure
      const validatedResponse = validateUpdateResponse(data);
      return validatedResponse;
    } catch (error) {
      if (error instanceof NetworkError || error instanceof ValidationError) {
        throw error;
      }
      throw new UpdateCheckError("Failed to check for updates", error);
    }
  }

  async downloadAndInstall(
    downloadUrl: string,
    onProgress?: (progress: number) => void,
  ): Promise<void> {
    if (this.downloadingRef.current) {
      return;
    }

    this.downloadingRef.current = true;

    try {
      const cacheFileName = this.config.cacheFileName || "app-update";

      await downloadAndInstallApk({
        downloadUrl,
        cacheFileName,
        onProgress,
      });
    } catch (error) {
      throw error; // Re-throw so hook can handle it
    } finally {
      this.downloadingRef.current = false;
    }
  }

  isDownloading(): boolean {
    return this.downloadingRef.current;
  }

  async openWebsite(backendWebsiteUrl?: string): Promise<void> {
    const websiteUrl = backendWebsiteUrl || this.config.websiteUrl;
    if (!websiteUrl) {
      return;
    }

    const adapter = getPlatformAdapterInstance();
    const canOpen = await adapter.linking.canOpenURL(websiteUrl);
    if (canOpen) {
      await adapter.linking.openURL(websiteUrl);
    }
  }
}
