/**
 * Integration tests for the complete update flow
 * Tests the interaction between hook, service, and utilities
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useAppUpdate } from "../useAppUpdate";
import * as ExpoFileSystem from "expo-file-system";
import * as FileSystemLegacy from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import * as Linking from "expo-linking";

// Mock Expo modules
jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation(() => ({})),
  Paths: {
    cache: "mock://cache",
  },
}));
jest.mock("expo-file-system/legacy");
jest.mock("expo-intent-launcher");
jest.mock("expo-linking");

// Create a mock for File.downloadFileAsync
const mockDownloadFileAsync = jest.fn();
(ExpoFileSystem.File as any).downloadFileAsync = mockDownloadFileAsync;

const mockGetInfoAsync = FileSystemLegacy.getInfoAsync as jest.MockedFunction<
  typeof FileSystemLegacy.getInfoAsync
>;
const mockGetContentUriAsync = FileSystemLegacy.getContentUriAsync as jest.MockedFunction<
  typeof FileSystemLegacy.getContentUriAsync
>;
const mockStartActivityAsync = IntentLauncher.startActivityAsync as jest.MockedFunction<
  typeof IntentLauncher.startActivityAsync
>;
const mockCanOpenURL = Linking.canOpenURL as jest.MockedFunction<typeof Linking.canOpenURL>;
const mockOpenURL = Linking.openURL as jest.MockedFunction<typeof Linking.openURL>;

describe("Integration Tests", () => {
  const config = {
    apiUrl: "https://api.example.com/check-version",
    version: "1.0.0",
    buildType: "production",
    projectName: "TestApp",
    packageName: "com.test.app",
    checkOnLaunch: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe("Complete update flow - optional update", () => {
    it("should complete full update flow successfully", async () => {
      // Mock API response
      const apiResponse = {
        updateAvailable: true,
        latestVersion: "2.0.0",
        mandatory: false,
        downloadUrl: "https://example.com/app-v2.0.0.apk",
        websiteUrl: "https://example.com/download",
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify(apiResponse)),
      });

      // Mock download success
      mockDownloadFileAsync.mockResolvedValue({ uri: "file://cache/app.apk" } as any);
      mockGetInfoAsync.mockResolvedValue({ exists: true, size: 5000000 } as any);
      mockGetContentUriAsync.mockResolvedValue("content://cache/app.apk");
      mockStartActivityAsync.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAppUpdate(config));

      // Step 1: Check for update
      expect(result.current.updateState).toBe("idle");

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(result.current.updateState).toBe("available");
      expect(result.current.latestVersion).toBe("2.0.0");
      expect(result.current.isMandatory).toBe(false);
      expect(global.fetch).toHaveBeenCalledWith(
        config.apiUrl,
        expect.objectContaining({
          method: "POST",
        })
      );

      // Step 2: User dismisses with "Later"
      act(() => {
        result.current.handleLater();
      });

      expect(result.current.updateState).toBe("hidden");

      // Step 3: User decides to update
      // Need to check again to restore state
      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(result.current.updateState).toBe("available");

      // Step 4: Download and install
      await act(async () => {
        await result.current.updateNow();
      });

      expect(mockDownloadFileAsync).toHaveBeenCalled();
      expect(mockStartActivityAsync).toHaveBeenCalledWith(
        "android.intent.action.VIEW",
        expect.objectContaining({
          data: "content://cache/app.apk",
          type: "application/vnd.android.package-archive",
        })
      );
      expect(result.current.updateState).toBe("hidden");
    });
  });

  describe("Complete update flow - mandatory update", () => {
    it("should handle mandatory update flow", async () => {
      const apiResponse = {
        updateAvailable: true,
        latestVersion: "2.0.0",
        mandatory: true,
        downloadUrl: "https://example.com/app-v2.0.0.apk",
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify(apiResponse)),
      });

      mockDownloadFileAsync.mockResolvedValue({ uri: "file://cache/app.apk" } as any);
      mockGetInfoAsync.mockResolvedValue({ exists: true, size: 5000000 } as any);
      mockGetContentUriAsync.mockResolvedValue("content://cache/app.apk");
      mockStartActivityAsync.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAppUpdate(config));

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(result.current.updateState).toBe("available");
      expect(result.current.isMandatory).toBe(true);

      // In mandatory mode, UI should prevent dismissal
      // But handleLater still works programmatically
      // The UI layer should check isMandatory and hide the "Later" button

      await act(async () => {
        await result.current.updateNow();
      });

      expect(mockStartActivityAsync).toHaveBeenCalled();
    });
  });

  describe("Error recovery flow", () => {
    it("should recover from network error with retry", async () => {
      // First check fails
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network timeout"));

      const { result } = renderHook(() => useAppUpdate(config));

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(result.current.updateState).toBe("error");
      expect(result.current.errorMessage).toBe("Failed to check for updates");

      // Retry succeeds
      const apiResponse = {
        updateAvailable: true,
        latestVersion: "2.0.0",
        downloadUrl: "https://example.com/app.apk",
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify(apiResponse)),
      });

      await act(async () => {
        await result.current.retry();
      });

      expect(result.current.updateState).toBe("available");
      expect(result.current.errorMessage).toBe("");
      expect(result.current.error).toBeNull();
    });

    it("should recover from download error with retry", async () => {
      const apiResponse = {
        updateAvailable: true,
        latestVersion: "2.0.0",
        downloadUrl: "https://example.com/app.apk",
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify(apiResponse)),
      });

      const { result } = renderHook(() => useAppUpdate(config));

      await act(async () => {
        await result.current.checkForUpdate();
      });

      // First download fails
      mockDownloadFileAsync.mockRejectedValueOnce(new Error("Download failed"));

      await act(async () => {
        await result.current.updateNow();
      });

      expect(result.current.updateState).toBe("error");
      expect(result.current.downloading).toBe(false);

      // Retry download succeeds
      mockDownloadFileAsync.mockResolvedValue({ uri: "file://cache/app.apk" } as any);
      mockGetInfoAsync.mockResolvedValue({ exists: true, size: 5000000 } as any);
      mockGetContentUriAsync.mockResolvedValue("content://cache/app.apk");
      mockStartActivityAsync.mockResolvedValue(undefined);

      // Need to check for update again to restore available state
      await act(async () => {
        await result.current.retry();
      });

      await act(async () => {
        await result.current.updateNow();
      });

      expect(result.current.updateState).toBe("hidden");
      expect(mockStartActivityAsync).toHaveBeenCalled();
    });
  });

  describe("Progress tracking", () => {
    it("should track download progress from 0 to 100%", async () => {
      const apiResponse = {
        updateAvailable: true,
        latestVersion: "2.0.0",
        downloadUrl: "https://example.com/app.apk",
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify(apiResponse)),
      });

      const progressValues: number[] = [];
      let capturedProgressCallback: any;

      mockDownloadFileAsync.mockImplementation(async (url, dest, opts) => {
        capturedProgressCallback = opts.onProgress;
        return { uri: "file://cache/app.apk" } as any;
      });

      mockGetInfoAsync.mockResolvedValue({ exists: true, size: 5000000 } as any);
      mockGetContentUriAsync.mockResolvedValue("content://cache/app.apk");
      mockStartActivityAsync.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useAppUpdate({
          ...config,
          onDownloadProgress: (progress) => progressValues.push(progress),
        })
      );

      await act(async () => {
        await result.current.checkForUpdate();
      });

      act(() => {
        result.current.updateNow();
      });

      await waitFor(() => {
        expect(capturedProgressCallback).toBeDefined();
      });

      // Simulate progress updates
      act(() => {
        capturedProgressCallback({ bytesWritten: 0, totalBytes: 1000000 });
      });
      expect(result.current.downloadProgress).toBe(0);

      act(() => {
        capturedProgressCallback({ bytesWritten: 250000, totalBytes: 1000000 });
      });
      expect(result.current.downloadProgress).toBe(0.25);

      act(() => {
        capturedProgressCallback({ bytesWritten: 500000, totalBytes: 1000000 });
      });
      expect(result.current.downloadProgress).toBe(0.5);

      act(() => {
        capturedProgressCallback({ bytesWritten: 750000, totalBytes: 1000000 });
      });
      expect(result.current.downloadProgress).toBe(0.75);

      act(() => {
        capturedProgressCallback({ bytesWritten: 1000000, totalBytes: 1000000 });
      });
      expect(result.current.downloadProgress).toBe(1);

      await waitFor(() => {
        expect(result.current.downloading).toBe(false);
      });

      // Verify callback was called with all progress values
      expect(progressValues).toEqual([0, 0.25, 0.5, 0.75, 1]);
    });
  });

  describe("Website opening flow", () => {
    it("should open website when requested", async () => {
      const apiResponse = {
        updateAvailable: true,
        latestVersion: "2.0.0",
        downloadUrl: "https://example.com/app.apk",
        websiteUrl: "https://example.com/download",
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify(apiResponse)),
      });

      mockCanOpenURL.mockResolvedValue(true);
      mockOpenURL.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAppUpdate(config));

      await act(async () => {
        await result.current.checkForUpdate();
      });

      await act(async () => {
        await result.current.openWebsite();
      });

      expect(mockCanOpenURL).toHaveBeenCalledWith("https://example.com/download");
      expect(mockOpenURL).toHaveBeenCalledWith("https://example.com/download");
    });
  });

  describe("Event callbacks", () => {
    it("should call all callbacks throughout the flow", async () => {
      const callbacks = {
        onUpdateAvailable: jest.fn(),
        onUpdateError: jest.fn(),
        onDownloadProgress: jest.fn(),
      };

      const apiResponse = {
        updateAvailable: true,
        latestVersion: "2.0.0",
        downloadUrl: "https://example.com/app.apk",
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify(apiResponse)),
      });

      let capturedProgressCallback: any;
      mockDownloadFileAsync.mockImplementation(async (url, dest, opts) => {
        capturedProgressCallback = opts.onProgress;
        return { uri: "file://cache/app.apk" } as any;
      });

      mockGetInfoAsync.mockResolvedValue({ exists: true, size: 5000000 } as any);
      mockGetContentUriAsync.mockResolvedValue("content://cache/app.apk");
      mockStartActivityAsync.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAppUpdate({ ...config, ...callbacks }));

      // Check for update
      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(callbacks.onUpdateAvailable).toHaveBeenCalledWith(apiResponse);

      // Download with progress
      act(() => {
        result.current.updateNow();
      });

      await waitFor(() => {
        expect(capturedProgressCallback).toBeDefined();
      });

      act(() => {
        capturedProgressCallback({ bytesWritten: 500, totalBytes: 1000 });
      });

      expect(callbacks.onDownloadProgress).toHaveBeenCalledWith(0.5);

      await waitFor(() => {
        expect(result.current.downloading).toBe(false);
      });

      // No errors should have been called
      expect(callbacks.onUpdateError).not.toHaveBeenCalled();
    });

    it("should call onUpdateError when errors occur", async () => {
      const onUpdateError = jest.fn();

      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network failed"));

      const { result } = renderHook(() => useAppUpdate({ ...config, onUpdateError }));

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(onUpdateError).toHaveBeenCalledWith(expect.any(Error));
      expect(onUpdateError.mock.calls[0][0].message).toBe("Failed to check for updates");
    });
  });

  describe("No update available flow", () => {
    it("should handle no update gracefully", async () => {
      const onUpdateAvailable = jest.fn();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify({ updateAvailable: false })),
      });

      const { result } = renderHook(() => useAppUpdate({ ...config, onUpdateAvailable }));

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(result.current.updateState).toBe("hidden");
      expect(result.current.latestVersion).toBeNull();
      expect(result.current.isMandatory).toBe(false);
      expect(onUpdateAvailable).not.toHaveBeenCalled();
    });
  });

  describe("Duplicate download prevention", () => {
    it("should prevent concurrent downloads", async () => {
      const apiResponse = {
        updateAvailable: true,
        latestVersion: "2.0.0",
        downloadUrl: "https://example.com/app.apk",
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify(apiResponse)),
      });

      mockDownloadFileAsync.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ uri: "file://cache/app.apk" } as any), 100))
      );
      mockGetInfoAsync.mockResolvedValue({ exists: true, size: 5000000 } as any);
      mockGetContentUriAsync.mockResolvedValue("content://cache/app.apk");
      mockStartActivityAsync.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAppUpdate(config));

      await act(async () => {
        await result.current.checkForUpdate();
      });

      // Trigger multiple simultaneous downloads
      act(() => {
        result.current.updateNow();
        result.current.updateNow();
        result.current.updateNow();
      });

      await waitFor(() => {
        expect(result.current.downloading).toBe(false);
      });

      // Should only download once
      expect(mockDownloadFileAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe("Auto-check on launch", () => {
    it("should automatically check for updates on mount", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify({ updateAvailable: false })),
      });

      renderHook(() => useAppUpdate({ ...config, checkOnLaunch: true }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });
  });
});
