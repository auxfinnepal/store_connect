import { downloadApk, installApk, downloadAndInstallApk } from "../utils/apk";
import { DownloadError, InstallationError } from "../errors";
import { getPlatformAdapterInstance, resetPlatformAdapter } from "../adapters";

// Mock the adapter modules
jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation(() => ({})),
  Paths: {
    cache: "mock://cache",
  },
}));
jest.mock("expo-file-system/legacy");
jest.mock("expo-intent-launcher");

// Mock react-native-fs module (for React Native CLI adapter)
jest.mock("react-native-fs", () => ({
  CachesDirectoryPath: "/mock/cache",
  downloadFile: jest.fn(),
  exists: jest.fn(),
  stat: jest.fn(),
}), { virtual: true });

// Create mocks for the file system operations
const mockDownloadFile = jest.fn();
const mockGetFileInfo = jest.fn();
const mockGetCacheDirectory = jest.fn().mockReturnValue("mock://cache");
const mockStartActivity = jest.fn();

// Mock the getPlatformAdapterInstance
jest.mock("../adapters", () => {
  const originalModule = jest.requireActual("../adapters");
  return {
    ...originalModule,
    getPlatformAdapterInstance: jest.fn(() => ({
      fileSystem: {
        downloadFile: mockDownloadFile,
        getFileInfo: mockGetFileInfo,
        getCacheDirectory: mockGetCacheDirectory,
      },
      intentLauncher: {
        startActivity: mockStartActivity,
      },
      linking: {
        canOpenURL: jest.fn(),
        openURL: jest.fn(),
      },
    })),
    resetPlatformAdapter: jest.fn(),
  };
});

describe("APK Utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(1234567890);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("downloadApk", () => {
    const options = {
      downloadUrl: "https://example.com/app.apk",
      cacheFileName: "test-app",
    };

    it("should download APK successfully", async () => {
      mockDownloadFile.mockResolvedValue({
        localUri: "file://cache/test-app_1234567890.apk",
        contentUri: "content://cache/test-app.apk",
      });

      const result = await downloadApk(options);

      expect(result).toEqual({
        localUri: "file://cache/test-app_1234567890.apk",
        contentUri: "content://cache/test-app.apk",
      });
    });

    it("should call adapter downloadFile with correct parameters", async () => {
      mockDownloadFile.mockResolvedValue({
        localUri: "file://cache/test-app_1234567890.apk",
        contentUri: "content://cache/test-app.apk",
      });

      await downloadApk(options);

      expect(mockDownloadFile).toHaveBeenCalledWith({
        url: "https://example.com/app.apk",
        destination: expect.stringContaining("test-app_1234567890.apk"),
        onProgress: undefined,
      });
    });

    it("should call progress callback", async () => {
      const onProgress = jest.fn();
      mockDownloadFile.mockResolvedValue({
        localUri: "file://cache/test-app_1234567890.apk",
        contentUri: "content://cache/test-app.apk",
      });

      await downloadApk({ ...options, onProgress });

      expect(mockDownloadFile).toHaveBeenCalledWith({
        url: "https://example.com/app.apk",
        destination: expect.stringContaining("test-app_1234567890.apk"),
        onProgress,
      });
    });

    it("should throw DownloadError if adapter fails", async () => {
      mockDownloadFile.mockRejectedValue(new Error("Network error"));

      await expect(downloadApk(options)).rejects.toThrow(DownloadError);
      await expect(downloadApk(options)).rejects.toThrow("Failed to download APK");
    });

    it("should preserve original DownloadError", async () => {
      const originalError = new DownloadError("Original error");
      mockDownloadFile.mockRejectedValue(originalError);

      await expect(downloadApk(options)).rejects.toThrow(originalError);
    });
  });

  describe("installApk", () => {
    it("should call startActivity with correct parameters", async () => {
      mockStartActivity.mockResolvedValue(undefined);

      await installApk("content://cache/test-app.apk");

      expect(mockStartActivity).toHaveBeenCalledWith("android.intent.action.VIEW", {
        data: "content://cache/test-app.apk",
        type: "application/vnd.android.package-archive",
        flags: 0x10000001,
      });
    });

    it("should throw InstallationError if startActivity fails", async () => {
      mockStartActivity.mockRejectedValue(new Error("Intent failed"));

      await expect(installApk("content://cache/test-app.apk")).rejects.toThrow(
        InstallationError
      );
      await expect(installApk("content://cache/test-app.apk")).rejects.toThrow(
        "Failed to launch APK installer"
      );
    });
  });

  describe("downloadAndInstallApk", () => {
    const options = {
      downloadUrl: "https://example.com/app.apk",
      cacheFileName: "test-app",
    };

    it("should download and install APK successfully", async () => {
      mockDownloadFile.mockResolvedValue({
        localUri: "file://cache/test-app_1234567890.apk",
        contentUri: "content://cache/test-app.apk",
      });
      mockStartActivity.mockResolvedValue(undefined);

      await downloadAndInstallApk(options);

      expect(mockDownloadFile).toHaveBeenCalled();
      expect(mockStartActivity).toHaveBeenCalledWith(
        "android.intent.action.VIEW",
        expect.objectContaining({
          data: "content://cache/test-app.apk",
        })
      );
    });

    it("should throw DownloadError if download fails", async () => {
      mockDownloadFile.mockRejectedValue(new Error("Download failed"));

      await expect(downloadAndInstallApk(options)).rejects.toThrow(DownloadError);
      expect(mockStartActivity).not.toHaveBeenCalled();
    });

    it("should throw InstallationError if installation fails", async () => {
      mockDownloadFile.mockResolvedValue({
        localUri: "file://cache/test-app_1234567890.apk",
        contentUri: "content://cache/test-app.apk",
      });
      mockStartActivity.mockRejectedValue(new Error("Installation failed"));

      await expect(downloadAndInstallApk(options)).rejects.toThrow(InstallationError);
    });

    it("should pass progress callback through", async () => {
      const onProgress = jest.fn();
      mockDownloadFile.mockResolvedValue({
        localUri: "file://cache/test-app_1234567890.apk",
        contentUri: "content://cache/test-app.apk",
      });
      mockStartActivity.mockResolvedValue(undefined);

      await downloadAndInstallApk({ ...options, onProgress });

      expect(mockDownloadFile).toHaveBeenCalledWith({
        url: "https://example.com/app.apk",
        destination: expect.stringContaining("test-app_1234567890.apk"),
        onProgress,
      });
    });
  });
});
