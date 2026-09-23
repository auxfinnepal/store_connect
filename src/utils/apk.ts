import { Platform } from "react-native";
import { getPlatformAdapterInstance } from "../adapters";
import { DownloadError, InstallationError } from "../errors";

export interface DownloadApkOptions {
  downloadUrl: string;
  cacheFileName: string;
  onProgress?: (progress: number) => void;
}

export interface DownloadApkResult {
  localUri: string;
  contentUri: string;
}

/**
 * Download an APK file to the app's cache directory and return both file:// and content:// URIs.
 */
export async function downloadApk(
  options: DownloadApkOptions,
): Promise<DownloadApkResult> {
  const { downloadUrl, cacheFileName, onProgress } = options;

  if (Platform.OS !== "android") {
    throw new DownloadError("APK download is only supported on Android");
  }

  try {
    const adapter = getPlatformAdapterInstance();
    const fileName = `${cacheFileName}_${Date.now()}.apk`;
    const destination = `${adapter.fileSystem.getCacheDirectory()}/${fileName}`;

    const result = await adapter.fileSystem.downloadFile({
      url: downloadUrl,
      destination,
      onProgress,
    });

    return {
      localUri: result.localUri,
      contentUri: result.contentUri,
    };
  } catch (err) {
    if (err instanceof DownloadError) {
      throw err;
    }
    throw new DownloadError("Failed to download APK", err);
  }
}

/**
 * Launch the Android Package Installer with the given content:// URI.
 */
export async function installApk(contentUri: string): Promise<void> {
  if (Platform.OS !== "android") {
    throw new InstallationError(
      "APK installation is only supported on Android",
    );
  }

  try {
    const adapter = getPlatformAdapterInstance();

    // FLAG_ACTIVITY_NEW_TASK (0x10000000) | FLAG_GRANT_READ_URI_PERMISSION (0x1)
    const flags = 0x10000001;

    await adapter.intentLauncher.startActivity("android.intent.action.VIEW", {
      data: contentUri,
      type: "application/vnd.android.package-archive",
      flags,
    });
  } catch (err) {
    throw new InstallationError("Failed to launch APK installer", err);
  }
}

/**
 * Download an APK and immediately launch the Android Package Installer.
 */
export async function downloadAndInstallApk(
  options: DownloadApkOptions,
): Promise<void> {
  const result = await downloadApk(options);

  await installApk(result.contentUri);
}
