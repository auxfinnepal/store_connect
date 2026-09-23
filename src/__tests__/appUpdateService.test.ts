import { AppUpdateService } from "../appUpdateService";
import { NetworkError, UpdateCheckError, ValidationError } from "../errors";
import * as Linking from "expo-linking";
import { downloadAndInstallApk } from "../utils/apk";

// Mock the utilities
jest.mock("../utils/apk");
jest.mock("expo-linking");

const mockDownloadAndInstallApk = downloadAndInstallApk as jest.MockedFunction<
  typeof downloadAndInstallApk
>;
const mockCanOpenURL = Linking.canOpenURL as jest.MockedFunction<typeof Linking.canOpenURL>;
const mockOpenURL = Linking.openURL as jest.MockedFunction<typeof Linking.openURL>;

describe("AppUpdateService", () => {
  const validConfig = {
    apiUrl: "https://api.example.com/check-version",
    version: "1.0.0",
    buildType: "production",
    projectName: "TestApp",
    packageName: "com.test.app",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe("constructor", () => {
    it("should create service with valid config", () => {
      const service = new AppUpdateService(validConfig);
      expect(service).toBeInstanceOf(AppUpdateService);
    });

    it("should throw ValidationError for missing apiUrl", () => {
      const invalidConfig = { ...validConfig, apiUrl: "" };
      expect(() => new AppUpdateService(invalidConfig)).toThrow(ValidationError);
    });

    it("should throw ValidationError for invalid apiUrl", () => {
      const invalidConfig = { ...validConfig, apiUrl: "not-a-url" };
      expect(() => new AppUpdateService(invalidConfig)).toThrow(ValidationError);
    });

    it("should throw ValidationError for missing version", () => {
      const invalidConfig = { ...validConfig, version: "" };
      expect(() => new AppUpdateService(invalidConfig)).toThrow(ValidationError);
    });

    it("should throw ValidationError for missing buildType", () => {
      const invalidConfig = { ...validConfig, buildType: "" };
      expect(() => new AppUpdateService(invalidConfig)).toThrow(ValidationError);
    });

    it("should throw ValidationError for missing projectName", () => {
      const invalidConfig = { ...validConfig, projectName: "" };
      expect(() => new AppUpdateService(invalidConfig)).toThrow(ValidationError);
    });

    it("should throw ValidationError for missing packageName", () => {
      const invalidConfig = { ...validConfig, packageName: "" };
      expect(() => new AppUpdateService(invalidConfig)).toThrow(ValidationError);
    });
  });

  describe("checkForUpdate", () => {
    let service: AppUpdateService;

    beforeEach(() => {
      service = new AppUpdateService(validConfig);
    });

    it("should send POST request with correct body", async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify({ updateAvailable: false })),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await service.checkForUpdate();

      expect(global.fetch).toHaveBeenCalledWith(
        validConfig.apiUrl,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            version: validConfig.version,
            buildType: validConfig.buildType,
            projectName: validConfig.projectName,
            packageName: validConfig.packageName,
          }),
        })
      );
    });

    it("should include custom headers", async () => {
      const configWithHeaders = {
        ...validConfig,
        requestHeaders: {
          Authorization: "Bearer token123",
          "X-Custom": "value",
        },
      };
      const serviceWithHeaders = new AppUpdateService(configWithHeaders);

      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify({ updateAvailable: false })),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await serviceWithHeaders.checkForUpdate();

      expect(global.fetch).toHaveBeenCalledWith(
        validConfig.apiUrl,
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer token123",
            "X-Custom": "value",
          }),
        })
      );
    });

    it("should return valid response when no update available", async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify({ updateAvailable: false })),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.checkForUpdate();

      expect(result).toEqual({ updateAvailable: false });
    });

    it("should return valid response when update available", async () => {
      const responseData = {
        updateAvailable: true,
        latestVersion: "2.0.0",
        mandatory: true,
        downloadUrl: "https://example.com/app.apk",
        websiteUrl: "https://example.com",
      };
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify(responseData)),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.checkForUpdate();

      expect(result).toEqual(responseData);
    });

    it("should throw NetworkError for 400 status", async () => {
      const mockResponse = { ok: false, status: 400 };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(service.checkForUpdate()).rejects.toThrow(NetworkError);
      await expect(service.checkForUpdate()).rejects.toThrow(
        "Update check failed with status 400"
      );
    });

    it("should throw NetworkError for 401 status", async () => {
      const mockResponse = { ok: false, status: 401 };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(service.checkForUpdate()).rejects.toThrow(NetworkError);
    });

    it("should throw NetworkError for 404 status", async () => {
      const mockResponse = { ok: false, status: 404 };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(service.checkForUpdate()).rejects.toThrow(NetworkError);
    });

    it("should throw NetworkError for 500 status", async () => {
      const mockResponse = { ok: false, status: 500 };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(service.checkForUpdate()).rejects.toThrow(NetworkError);
      const error = await service.checkForUpdate().catch((e) => e);
      expect(error.statusCode).toBe(500);
    });

    it("should throw ValidationError for invalid JSON", async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue("not valid json"),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(service.checkForUpdate()).rejects.toThrow(ValidationError);
      await expect(service.checkForUpdate()).rejects.toThrow(
        "Server returned invalid JSON response"
      );
    });

    it("should throw ValidationError for non-object response", async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify("string")),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(service.checkForUpdate()).rejects.toThrow(ValidationError);
      await expect(service.checkForUpdate()).rejects.toThrow("Response must be an object");
    });

    it("should throw ValidationError for missing updateAvailable", async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify({})),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(service.checkForUpdate()).rejects.toThrow(ValidationError);
      await expect(service.checkForUpdate()).rejects.toThrow(
        "Response must contain 'updateAvailable' as a boolean"
      );
    });

    it("should throw ValidationError for non-boolean updateAvailable", async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify({ updateAvailable: "true" })),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(service.checkForUpdate()).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for non-string latestVersion", async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            updateAvailable: true,
            latestVersion: 123,
          })
        ),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(service.checkForUpdate()).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for non-boolean mandatory", async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            updateAvailable: true,
            mandatory: "yes",
          })
        ),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(service.checkForUpdate()).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for invalid downloadUrl", async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            updateAvailable: true,
            downloadUrl: "not-a-url",
          })
        ),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(service.checkForUpdate()).rejects.toThrow(ValidationError);
    });

    it("should throw UpdateCheckError for network failure", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network failed"));

      await expect(service.checkForUpdate()).rejects.toThrow(UpdateCheckError);
      await expect(service.checkForUpdate()).rejects.toThrow("Failed to check for updates");
    });

    it("should accept extra fields in response", async () => {
      const responseData = {
        updateAvailable: false,
        customField: "custom value",
        anotherField: 123,
      };
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify(responseData)),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await service.checkForUpdate();

      expect(result).toEqual(responseData);
    });
  });

  describe("downloadAndInstall", () => {
    let service: AppUpdateService;

    beforeEach(() => {
      service = new AppUpdateService(validConfig);
      mockDownloadAndInstallApk.mockResolvedValue(undefined);
    });

    it("should call downloadAndInstallApk with correct params", async () => {
      const downloadUrl = "https://example.com/app.apk";

      await service.downloadAndInstall(downloadUrl);

      expect(mockDownloadAndInstallApk).toHaveBeenCalledWith({
        downloadUrl,
        cacheFileName: "app-update",
        onProgress: undefined,
      });
    });

    it("should use custom cache file name", async () => {
      const customConfig = { ...validConfig, cacheFileName: "my-app" };
      const customService = new AppUpdateService(customConfig);

      await customService.downloadAndInstall("https://example.com/app.apk");

      expect(mockDownloadAndInstallApk).toHaveBeenCalledWith(
        expect.objectContaining({
          cacheFileName: "my-app",
        })
      );
    });

    it("should pass progress callback", async () => {
      const onProgress = jest.fn();

      await service.downloadAndInstall("https://example.com/app.apk", onProgress);

      expect(mockDownloadAndInstallApk).toHaveBeenCalledWith(
        expect.objectContaining({
          onProgress,
        })
      );
    });

    it("should prevent duplicate downloads", async () => {
      mockDownloadAndInstallApk.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const promise1 = service.downloadAndInstall("https://example.com/app.apk");
      const promise2 = service.downloadAndInstall("https://example.com/app.apk");
      const promise3 = service.downloadAndInstall("https://example.com/app.apk");

      await promise1;
      await promise2;
      await promise3;

      // Should only be called once despite three attempts
      expect(mockDownloadAndInstallApk).toHaveBeenCalledTimes(1);
    });

    it("should release download lock after success", async () => {
      await service.downloadAndInstall("https://example.com/app.apk");

      expect(service.isDownloading()).toBe(false);

      // Should allow second download after first completes
      await service.downloadAndInstall("https://example.com/app.apk");

      expect(mockDownloadAndInstallApk).toHaveBeenCalledTimes(2);
    });

    it("should release download lock after failure", async () => {
      mockDownloadAndInstallApk.mockRejectedValueOnce(new Error("Download failed"));

      await expect(service.downloadAndInstall("https://example.com/app.apk")).rejects.toThrow();

      expect(service.isDownloading()).toBe(false);

      // Should allow retry after failure
      mockDownloadAndInstallApk.mockResolvedValueOnce(undefined);
      await service.downloadAndInstall("https://example.com/app.apk");

      expect(mockDownloadAndInstallApk).toHaveBeenCalledTimes(2);
    });
  });

  describe("isDownloading", () => {
    it("should return false initially", () => {
      const service = new AppUpdateService(validConfig);
      expect(service.isDownloading()).toBe(false);
    });

    it("should return true during download", async () => {
      const service = new AppUpdateService(validConfig);
      let isDownloadingDuringDownload = false;

      mockDownloadAndInstallApk.mockImplementation(async () => {
        isDownloadingDuringDownload = service.isDownloading();
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      await service.downloadAndInstall("https://example.com/app.apk");

      expect(isDownloadingDuringDownload).toBe(true);
      expect(service.isDownloading()).toBe(false);
    });
  });

  describe("openWebsite", () => {
    let service: AppUpdateService;

    beforeEach(() => {
      service = new AppUpdateService(validConfig);
      mockCanOpenURL.mockResolvedValue(true);
      mockOpenURL.mockResolvedValue(undefined);
    });

    it("should open backend website URL if provided", async () => {
      const websiteUrl = "https://backend.example.com";

      await service.openWebsite(websiteUrl);

      expect(mockCanOpenURL).toHaveBeenCalledWith(websiteUrl);
      expect(mockOpenURL).toHaveBeenCalledWith(websiteUrl);
    });

    it("should fall back to config website URL", async () => {
      const configWithWebsite = {
        ...validConfig,
        websiteUrl: "https://config.example.com",
      };
      const serviceWithWebsite = new AppUpdateService(configWithWebsite);

      await serviceWithWebsite.openWebsite();

      expect(mockCanOpenURL).toHaveBeenCalledWith("https://config.example.com");
      expect(mockOpenURL).toHaveBeenCalledWith("https://config.example.com");
    });

    it("should prefer backend URL over config URL", async () => {
      const configWithWebsite = {
        ...validConfig,
        websiteUrl: "https://config.example.com",
      };
      const serviceWithWebsite = new AppUpdateService(configWithWebsite);

      await serviceWithWebsite.openWebsite("https://backend.example.com");

      expect(mockCanOpenURL).toHaveBeenCalledWith("https://backend.example.com");
      expect(mockOpenURL).toHaveBeenCalledWith("https://backend.example.com");
    });

    it("should do nothing if no URL provided", async () => {
      await service.openWebsite();

      expect(mockCanOpenURL).not.toHaveBeenCalled();
      expect(mockOpenURL).not.toHaveBeenCalled();
    });

    it("should not open URL if canOpenURL returns false", async () => {
      mockCanOpenURL.mockResolvedValue(false);

      await service.openWebsite("https://example.com");

      expect(mockCanOpenURL).toHaveBeenCalled();
      expect(mockOpenURL).not.toHaveBeenCalled();
    });

    it("should not open URL if URL is empty string", async () => {
      await service.openWebsite("");

      expect(mockCanOpenURL).not.toHaveBeenCalled();
      expect(mockOpenURL).not.toHaveBeenCalled();
    });
  });
});
