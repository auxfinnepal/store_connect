import { renderHook, act, waitFor } from "@testing-library/react";
import { useAppUpdate } from "../useAppUpdate";
import { AppUpdateService } from "../appUpdateService";
import type { AppUpdateResponse } from "../types";

// Mock the service
jest.mock("../appUpdateService");

const MockedAppUpdateService = AppUpdateService as jest.MockedClass<typeof AppUpdateService>;

describe("useAppUpdate", () => {
  const validConfig = {
    apiUrl: "https://api.example.com/check-version",
    version: "1.0.0",
    buildType: "production",
    projectName: "TestApp",
    packageName: "com.test.app",
    checkOnLaunch: false, // Disable auto-check for most tests
  };

  let mockServiceInstance: jest.Mocked<AppUpdateService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock service instance
    mockServiceInstance = {
      checkForUpdate: jest.fn(),
      downloadAndInstall: jest.fn(),
      isDownloading: jest.fn().mockReturnValue(false),
      openWebsite: jest.fn(),
    } as any;

    MockedAppUpdateService.mockImplementation(() => mockServiceInstance);
  });

  describe("initial state", () => {
    it("should have correct initial values", () => {
      const { result } = renderHook(() => useAppUpdate(validConfig));

      expect(result.current.updateState).toBe("idle");
      expect(result.current.latestVersion).toBeNull();
      expect(result.current.currentVersion).toBe("1.0.0");
      expect(result.current.isMandatory).toBe(false);
      expect(result.current.errorMessage).toBe("");
      expect(result.current.error).toBeNull();
      expect(result.current.response).toBeNull();
      expect(result.current.downloading).toBe(false);
      expect(result.current.downloadProgress).toBeNull();
    });

    it("should create service instance", () => {
      renderHook(() => useAppUpdate(validConfig));

      expect(MockedAppUpdateService).toHaveBeenCalledWith(validConfig);
    });
  });

  describe("checkForUpdate", () => {
    it("should transition to checking state", async () => {
      mockServiceInstance.checkForUpdate.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ updateAvailable: false }), 100))
      );

      const { result } = renderHook(() => useAppUpdate(validConfig));

      act(() => {
        result.current.checkForUpdate();
      });

      expect(result.current.updateState).toBe("checking");

      await waitFor(() => {
        expect(result.current.updateState).not.toBe("checking");
      });
    });

    it("should handle no update available", async () => {
      mockServiceInstance.checkForUpdate.mockResolvedValue({ updateAvailable: false });

      const { result } = renderHook(() => useAppUpdate(validConfig));

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(result.current.updateState).toBe("hidden");
      expect(result.current.response).toEqual({ updateAvailable: false });
    });

    it("should handle optional update available", async () => {
      const updateResponse: AppUpdateResponse = {
        updateAvailable: true,
        latestVersion: "2.0.0",
        mandatory: false,
        downloadUrl: "https://example.com/app.apk",
      };
      mockServiceInstance.checkForUpdate.mockResolvedValue(updateResponse);

      const { result } = renderHook(() => useAppUpdate(validConfig));

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(result.current.updateState).toBe("available");
      expect(result.current.latestVersion).toBe("2.0.0");
      expect(result.current.isMandatory).toBe(false);
      expect(result.current.response).toEqual(updateResponse);
    });

    it("should handle mandatory update", async () => {
      const updateResponse: AppUpdateResponse = {
        updateAvailable: true,
        latestVersion: "2.0.0",
        mandatory: true,
        downloadUrl: "https://example.com/app.apk",
      };
      mockServiceInstance.checkForUpdate.mockResolvedValue(updateResponse);

      const { result } = renderHook(() => useAppUpdate(validConfig));

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(result.current.updateState).toBe("available");
      expect(result.current.isMandatory).toBe(true);
    });

    it("should handle update without latestVersion", async () => {
      const updateResponse: AppUpdateResponse = {
        updateAvailable: true,
        downloadUrl: "https://example.com/app.apk",
      };
      mockServiceInstance.checkForUpdate.mockResolvedValue(updateResponse);

      const { result } = renderHook(() => useAppUpdate(validConfig));

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(result.current.latestVersion).toBeNull();
    });

    it("should handle update without downloadUrl", async () => {
      const updateResponse: AppUpdateResponse = {
        updateAvailable: true,
        latestVersion: "2.0.0",
      };
      mockServiceInstance.checkForUpdate.mockResolvedValue(updateResponse);

      const { result } = renderHook(() => useAppUpdate(validConfig));

      await act(async () => {
        await result.current.checkForUpdate();
      });

      // Should not show as available without downloadUrl
      expect(result.current.updateState).toBe("hidden");
    });

    it("should handle network error", async () => {
      const error = new Error("Network failed");
      mockServiceInstance.checkForUpdate.mockRejectedValue(error);

      const { result } = renderHook(() => useAppUpdate(validConfig));

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(result.current.updateState).toBe("error");
      expect(result.current.errorMessage).toBe("Network failed");
      expect(result.current.error).toBe(error);
    });

    it("should clear previous error before checking", async () => {
      // First call fails
      mockServiceInstance.checkForUpdate.mockRejectedValueOnce(new Error("Network failed"));

      const { result } = renderHook(() => useAppUpdate(validConfig));

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(result.current.updateState).toBe("error");
      expect(result.current.errorMessage).toBe("Network failed");

      // Second call succeeds
      mockServiceInstance.checkForUpdate.mockResolvedValueOnce({ updateAvailable: false });

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(result.current.updateState).toBe("hidden");
      expect(result.current.errorMessage).toBe("");
      expect(result.current.error).toBeNull();
    });

    it("should call onUpdateAvailable callback", async () => {
      const onUpdateAvailable = jest.fn();
      const updateResponse: AppUpdateResponse = {
        updateAvailable: true,
        latestVersion: "2.0.0",
        downloadUrl: "https://example.com/app.apk",
      };
      mockServiceInstance.checkForUpdate.mockResolvedValue(updateResponse);

      const { result } = renderHook(() =>
        useAppUpdate({ ...validConfig, onUpdateAvailable })
      );

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(onUpdateAvailable).toHaveBeenCalledWith(updateResponse);
    });

    it("should call onUpdateError callback", async () => {
      const onUpdateError = jest.fn();
      const error = new Error("Network failed");
      mockServiceInstance.checkForUpdate.mockRejectedValue(error);

      const { result } = renderHook(() => useAppUpdate({ ...validConfig, onUpdateError }));

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(onUpdateError).toHaveBeenCalledWith(error);
    });
  });

  describe("updateNow", () => {
    it("should transition to downloading state", async () => {
      mockServiceInstance.checkForUpdate.mockResolvedValue({
        updateAvailable: true,
        latestVersion: "2.0.0",
        downloadUrl: "https://example.com/app.apk",
      });
      mockServiceInstance.downloadAndInstall.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() => useAppUpdate(validConfig));

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(result.current.updateState).toBe("available");

      act(() => {
        result.current.updateNow();
      });

      expect(result.current.updateState).toBe("downloading");
      expect(result.current.downloading).toBe(true);
      expect(result.current.downloadProgress).toBe(0);

      await waitFor(() => {
        expect(result.current.downloading).toBe(false);
      });
    });

    it("should call downloadAndInstall with correct URL", async () => {
      mockServiceInstance.downloadAndInstall.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAppUpdate(validConfig));

      const updateResponse: AppUpdateResponse = {
        updateAvailable: true,
        downloadUrl: "https://example.com/app.apk",
      };
      mockServiceInstance.checkForUpdate.mockResolvedValue(updateResponse);

      await act(async () => {
        await result.current.checkForUpdate();
      });

      await act(async () => {
        await result.current.updateNow();
      });

      expect(mockServiceInstance.downloadAndInstall).toHaveBeenCalledWith(
        "https://example.com/app.apk",
        expect.any(Function)
      );
    });

    it("should update downloadProgress", async () => {
      let progressCallback: ((progress: number) => void) | undefined;

      mockServiceInstance.downloadAndInstall.mockImplementation(async (url, onProgress) => {
        progressCallback = onProgress;
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const { result } = renderHook(() => useAppUpdate(validConfig));

      const updateResponse: AppUpdateResponse = {
        updateAvailable: true,
        downloadUrl: "https://example.com/app.apk",
      };
      mockServiceInstance.checkForUpdate.mockResolvedValue(updateResponse);

      await act(async () => {
        await result.current.checkForUpdate();
      });

      act(() => {
        result.current.updateNow();
      });

      await waitFor(() => {
        expect(progressCallback).toBeDefined();
      });

      act(() => {
        progressCallback?.(0.5);
      });

      expect(result.current.downloadProgress).toBe(0.5);

      await waitFor(() => {
        expect(result.current.downloading).toBe(false);
      });
    });

    it("should call onDownloadProgress callback", async () => {
      const onDownloadProgress = jest.fn();
      let progressCallback: ((progress: number) => void) | undefined;

      mockServiceInstance.downloadAndInstall.mockImplementation(async (url, onProgress) => {
        progressCallback = onProgress;
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const { result } = renderHook(() =>
        useAppUpdate({ ...validConfig, onDownloadProgress })
      );

      const updateResponse: AppUpdateResponse = {
        updateAvailable: true,
        downloadUrl: "https://example.com/app.apk",
      };
      mockServiceInstance.checkForUpdate.mockResolvedValue(updateResponse);

      await act(async () => {
        await result.current.checkForUpdate();
      });

      act(() => {
        result.current.updateNow();
      });

      await waitFor(() => {
        expect(progressCallback).toBeDefined();
      });

      act(() => {
        progressCallback?.(0.75);
      });

      expect(onDownloadProgress).toHaveBeenCalledWith(0.75);

      await waitFor(() => {
        expect(result.current.downloading).toBe(false);
      });
    });

    it("should transition to hidden after successful download", async () => {
      mockServiceInstance.downloadAndInstall.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAppUpdate(validConfig));

      const updateResponse: AppUpdateResponse = {
        updateAvailable: true,
        downloadUrl: "https://example.com/app.apk",
      };
      mockServiceInstance.checkForUpdate.mockResolvedValue(updateResponse);

      await act(async () => {
        await result.current.checkForUpdate();
      });

      await act(async () => {
        await result.current.updateNow();
      });

      expect(result.current.updateState).toBe("hidden");
      expect(result.current.downloading).toBe(false);
      expect(result.current.downloadProgress).toBeNull();
    });

    it("should handle download error", async () => {
      const error = new Error("Download failed");
      mockServiceInstance.downloadAndInstall.mockRejectedValue(error);

      const { result } = renderHook(() => useAppUpdate(validConfig));

      const updateResponse: AppUpdateResponse = {
        updateAvailable: true,
        downloadUrl: "https://example.com/app.apk",
      };
      mockServiceInstance.checkForUpdate.mockResolvedValue(updateResponse);

      await act(async () => {
        await result.current.checkForUpdate();
      });

      await act(async () => {
        await result.current.updateNow();
      });

      expect(result.current.updateState).toBe("error");
      expect(result.current.errorMessage).toBe("Download failed");
      expect(result.current.error).toBe(error);
      expect(result.current.downloading).toBe(false);
      expect(result.current.downloadProgress).toBeNull();
    });

    it("should prevent duplicate downloads", async () => {
      mockServiceInstance.isDownloading.mockReturnValue(true);

      const { result } = renderHook(() => useAppUpdate(validConfig));

      const updateResponse: AppUpdateResponse = {
        updateAvailable: true,
        downloadUrl: "https://example.com/app.apk",
      };
      mockServiceInstance.checkForUpdate.mockResolvedValue(updateResponse);

      await act(async () => {
        await result.current.checkForUpdate();
      });

      await act(async () => {
        await result.current.updateNow();
      });

      // Service reports it's already downloading, so downloadAndInstall should not be called
      expect(mockServiceInstance.downloadAndInstall).not.toHaveBeenCalled();
    });

    it("should clear error before downloading", async () => {
      // First set an error state
      mockServiceInstance.checkForUpdate.mockRejectedValueOnce(new Error("Check failed"));

      const { result } = renderHook(() => useAppUpdate(validConfig));

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(result.current.updateState).toBe("error");

      // Now try to download
      const updateResponse: AppUpdateResponse = {
        updateAvailable: true,
        downloadUrl: "https://example.com/app.apk",
      };
      mockServiceInstance.checkForUpdate.mockResolvedValue(updateResponse);

      await act(async () => {
        await result.current.checkForUpdate();
      });

      mockServiceInstance.downloadAndInstall.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.updateNow();
      });

      expect(result.current.errorMessage).toBe("");
      expect(result.current.error).toBeNull();
    });
  });

  describe("openWebsite", () => {
    it("should call service openWebsite with response URL", async () => {
      mockServiceInstance.openWebsite.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAppUpdate(validConfig));

      const updateResponse: AppUpdateResponse = {
        updateAvailable: true,
        downloadUrl: "https://example.com/app.apk",
        websiteUrl: "https://example.com/download",
      };
      mockServiceInstance.checkForUpdate.mockResolvedValue(updateResponse);

      await act(async () => {
        await result.current.checkForUpdate();
      });

      await act(async () => {
        await result.current.openWebsite();
      });

      expect(mockServiceInstance.openWebsite).toHaveBeenCalledWith("https://example.com/download");
    });

    it("should handle openWebsite error", async () => {
      const error = new Error("Cannot open URL");
      mockServiceInstance.openWebsite.mockRejectedValue(error);

      const { result } = renderHook(() => useAppUpdate(validConfig));

      const updateResponse: AppUpdateResponse = {
        updateAvailable: true,
        downloadUrl: "https://example.com/app.apk",
        websiteUrl: "https://example.com/download",
      };
      mockServiceInstance.checkForUpdate.mockResolvedValue(updateResponse);

      await act(async () => {
        await result.current.checkForUpdate();
      });

      await act(async () => {
        await result.current.openWebsite();
      });

      expect(result.current.updateState).toBe("error");
      expect(result.current.errorMessage).toBe("Cannot open URL");
    });
  });

  describe("handleLater", () => {
    it("should transition to hidden state", async () => {
      const { result } = renderHook(() => useAppUpdate(validConfig));

      const updateResponse: AppUpdateResponse = {
        updateAvailable: true,
        downloadUrl: "https://example.com/app.apk",
      };
      mockServiceInstance.checkForUpdate.mockResolvedValue(updateResponse);

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(result.current.updateState).toBe("available");

      act(() => {
        result.current.handleLater();
      });

      expect(result.current.updateState).toBe("hidden");
    });

    it("should clear error state", async () => {
      mockServiceInstance.checkForUpdate.mockRejectedValue(new Error("Network failed"));

      const { result } = renderHook(() => useAppUpdate(validConfig));

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(result.current.updateState).toBe("error");
      expect(result.current.errorMessage).toBe("Network failed");

      act(() => {
        result.current.handleLater();
      });

      expect(result.current.updateState).toBe("hidden");
      expect(result.current.errorMessage).toBe("");
      expect(result.current.error).toBeNull();
    });
  });

  describe("retry", () => {
    it("should call checkForUpdate again", async () => {
      mockServiceInstance.checkForUpdate.mockResolvedValue({ updateAvailable: false });

      const { result } = renderHook(() => useAppUpdate(validConfig));

      await act(async () => {
        await result.current.retry();
      });

      expect(mockServiceInstance.checkForUpdate).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.retry();
      });

      expect(mockServiceInstance.checkForUpdate).toHaveBeenCalledTimes(2);
    });

    it("should retry after error", async () => {
      // First call fails
      mockServiceInstance.checkForUpdate.mockRejectedValueOnce(new Error("Network failed"));

      const { result } = renderHook(() => useAppUpdate(validConfig));

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(result.current.updateState).toBe("error");

      // Retry succeeds
      mockServiceInstance.checkForUpdate.mockResolvedValueOnce({ updateAvailable: false });

      await act(async () => {
        await result.current.retry();
      });

      expect(result.current.updateState).toBe("hidden");
      expect(result.current.errorMessage).toBe("");
    });
  });

  describe("auto check on launch", () => {
    it("should check for updates on mount when checkOnLaunch is true", async () => {
      mockServiceInstance.checkForUpdate.mockResolvedValue({ updateAvailable: false });

      renderHook(() => useAppUpdate({ ...validConfig, checkOnLaunch: true }));

      await waitFor(() => {
        expect(mockServiceInstance.checkForUpdate).toHaveBeenCalledTimes(1);
      });
    });

    it("should not check for updates on mount when checkOnLaunch is false", async () => {
      mockServiceInstance.checkForUpdate.mockResolvedValue({ updateAvailable: false });

      renderHook(() => useAppUpdate({ ...validConfig, checkOnLaunch: false }));

      // Wait a bit to ensure no call was made
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockServiceInstance.checkForUpdate).not.toHaveBeenCalled();
    });

    it("should check for updates on mount when checkOnLaunch is undefined (default true)", async () => {
      const configWithoutCheckOnLaunch = { ...validConfig };
      delete (configWithoutCheckOnLaunch as any).checkOnLaunch;

      mockServiceInstance.checkForUpdate.mockResolvedValue({ updateAvailable: false });

      renderHook(() => useAppUpdate(configWithoutCheckOnLaunch));

      await waitFor(() => {
        expect(mockServiceInstance.checkForUpdate).toHaveBeenCalledTimes(1);
      });
    });

    it("should only check once on mount even with re-renders", async () => {
      mockServiceInstance.checkForUpdate.mockResolvedValue({ updateAvailable: false });

      const { rerender } = renderHook(() =>
        useAppUpdate({ ...validConfig, checkOnLaunch: true })
      );

      await waitFor(() => {
        expect(mockServiceInstance.checkForUpdate).toHaveBeenCalledTimes(1);
      });

      // Re-render multiple times
      rerender();
      rerender();
      rerender();

      // Should still only be called once
      expect(mockServiceInstance.checkForUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe("unmounting", () => {
    it("should not crash when unmounting during check", async () => {
      mockServiceInstance.checkForUpdate.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ updateAvailable: false }), 100))
      );

      const { result, unmount } = renderHook(() => useAppUpdate(validConfig));

      act(() => {
        result.current.checkForUpdate();
      });

      // Unmount while checking
      unmount();

      // No crash expected
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    it("should not crash when unmounting during download", async () => {
      mockServiceInstance.downloadAndInstall.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { result, unmount } = renderHook(() => useAppUpdate(validConfig));

      const updateResponse: AppUpdateResponse = {
        updateAvailable: true,
        downloadUrl: "https://example.com/app.apk",
      };
      mockServiceInstance.checkForUpdate.mockResolvedValue(updateResponse);

      await act(async () => {
        await result.current.checkForUpdate();
      });

      act(() => {
        result.current.updateNow();
      });

      // Unmount while downloading
      unmount();

      // No crash expected
      await new Promise((resolve) => setTimeout(resolve, 150));
    });
  });
});
