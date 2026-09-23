import { useCallback, useEffect, useRef, useState } from "react";
import { AppUpdateService } from "./appUpdateService";
import {
  AppUpdateConfig,
  AppUpdateResponse,
  UpdateState,
  UseAppUpdateReturn,
} from "./types";

export function useAppUpdate(config: AppUpdateConfig): UseAppUpdateReturn {
  const serviceRef = useRef<AppUpdateService | null>(null);
  const checkOnLaunchRef = useRef(config.checkOnLaunch ?? true);
  const initializedRef = useRef(false);

  const [updateState, setUpdateState] = useState<UpdateState>("idle");
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [isMandatory, setIsMandatory] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const [response, setResponse] = useState<AppUpdateResponse | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  if (!serviceRef.current) {
    serviceRef.current = new AppUpdateService(config);
  }

  const currentVersion = config.version;

  const handleError = useCallback(
    (err: Error, defaultMessage: string) => {
      const message = err.message || defaultMessage;
      setErrorMessage(message);
      setError(err);
      setUpdateState("error");
      config.onUpdateError?.(err);
    },
    [config],
  );

  const checkForUpdate = useCallback(async () => {
    const service = serviceRef.current;
    if (!service) return;

    setUpdateState("checking");
    setErrorMessage("");
    setError(null);

    try {
      const result = await service.checkForUpdate();
      setResponse(result);

      if (result.updateAvailable && result.downloadUrl) {
        setLatestVersion(result.latestVersion || null);
        setIsMandatory(result.mandatory ?? false);
        setUpdateState("available");
        config.onUpdateAvailable?.(result);
      } else {
        setUpdateState("hidden");
      }
    } catch (err) {
      handleError(
        err instanceof Error ? err : new Error(String(err)),
        "Failed to check for updates",
      );
    }
  }, [handleError, config]);

  const updateNow = useCallback(async () => {
    const service = serviceRef.current;
    if (!service) {
      return;
    }

    if (service.isDownloading()) {
      return;
    }

    setDownloading(true);
    setDownloadProgress(0);
    setErrorMessage("");
    setError(null);
    setUpdateState("downloading");

    if (!response?.downloadUrl) {
      handleError(
        new Error("No download URL available"),
        "No download URL available",
      );
      setDownloading(false);
      setDownloadProgress(null);
      return;
    }

    try {
      await service.downloadAndInstall(response.downloadUrl, (progress) => {
        setDownloadProgress(progress);
        config.onDownloadProgress?.(progress);
      });

      setUpdateState("hidden");
    } catch (err) {
      handleError(
        err instanceof Error ? err : new Error(String(err)),
        "Failed to download or install update",
      );
    } finally {
      setDownloading(false);
      setDownloadProgress(null);
    }
  }, [response?.downloadUrl, handleError, config]);

  const openWebsite = useCallback(async () => {
    const service = serviceRef.current;
    if (!service) return;

    try {
      await service.openWebsite(response?.websiteUrl);
    } catch (err) {
      handleError(
        err instanceof Error ? err : new Error(String(err)),
        "Failed to open website",
      );
    }
  }, [response?.websiteUrl, handleError]);

  const handleLater = useCallback(() => {
    setUpdateState("hidden");
    setErrorMessage("");
    setError(null);
  }, []);

  const retry = useCallback(async () => {
    await checkForUpdate();
  }, [checkForUpdate]);

  useEffect(() => {
    if (checkOnLaunchRef.current && !initializedRef.current) {
      initializedRef.current = true;
      checkForUpdate();
    }
  }, [checkForUpdate]);

  return {
    updateState,
    latestVersion,
    currentVersion,
    isMandatory,
    errorMessage,
    error,
    response,
    checkForUpdate,
    updateNow,
    openWebsite,
    handleLater,
    retry,
    downloading,
    downloadProgress,
  };
}
