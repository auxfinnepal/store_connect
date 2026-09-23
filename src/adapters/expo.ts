/**
 * Expo platform adapter
 * Uses expo-file-system, expo-intent-launcher, and expo-linking
 */

import { Platform } from "react-native";
import {
  FileSystemAdapter,
  IntentLauncherAdapter,
  LinkingAdapter,
  DownloadOptions,
  DownloadResult,
  FileInfo,
} from "./types";

let FileSystem: any;
let FileSystemLegacy: any;
let IntentLauncher: any;
let Linking: any;

try {
  FileSystem = require("expo-file-system");
  FileSystemLegacy = require("expo-file-system/legacy");
  IntentLauncher = require("expo-intent-launcher");
  Linking = require("expo-linking");
} catch (error) {
  // Expo modules not available
}

export class ExpoFileSystemAdapter implements FileSystemAdapter {
  async downloadFile(options: DownloadOptions): Promise<DownloadResult> {
    if (!FileSystem || !FileSystemLegacy) {
      throw new Error("expo-file-system is not installed");
    }

    const { url, destination, onProgress } = options;
    const fileName = destination.split("/").pop() || "download.apk";
    const file = new FileSystem.File(FileSystem.Paths.cache, fileName);

    const downloadedFile = await FileSystem.File.downloadFileAsync(url, file, {
      onProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.totalBytes > 0) {
          const progress =
            progressEvent.bytesWritten / progressEvent.totalBytes;
          const normalizedProgress = Math.max(0, Math.min(1, progress));
          onProgress(normalizedProgress);
        }
      },
    });

    const info = await FileSystemLegacy.getInfoAsync(downloadedFile.uri);
    if (!info.exists || (info.size || 0) === 0) {
      throw new Error("Downloaded APK is missing or empty");
    }

    const contentUri = await FileSystemLegacy.getContentUriAsync(
      downloadedFile.uri,
    );

    return {
      localUri: downloadedFile.uri,
      contentUri,
    };
  }

  async getFileInfo(uri: string): Promise<FileInfo> {
    if (!FileSystemLegacy) {
      throw new Error("expo-file-system is not installed");
    }

    const info = await FileSystemLegacy.getInfoAsync(uri);
    return {
      exists: info.exists,
      size: info.size,
      uri,
    };
  }

  getCacheDirectory(): string {
    if (!FileSystem) {
      throw new Error("expo-file-system is not installed");
    }
    return FileSystem.Paths.cache;
  }
}

export class ExpoIntentLauncherAdapter implements IntentLauncherAdapter {
  async startActivity(
    action: string,
    options: { data: string; type: string; flags: number },
  ): Promise<void> {
    if (!IntentLauncher) {
      throw new Error("expo-intent-launcher is not installed");
    }

    if (Platform.OS !== "android") {
      throw new Error("Intent launcher is only supported on Android");
    }

    await IntentLauncher.startActivityAsync(action, options);
  }
}

export class ExpoLinkingAdapter implements LinkingAdapter {
  async canOpenURL(url: string): Promise<boolean> {
    if (!Linking) {
      throw new Error("expo-linking is not installed");
    }
    return await Linking.canOpenURL(url);
  }

  async openURL(url: string): Promise<void> {
    if (!Linking) {
      throw new Error("expo-linking is not installed");
    }
    await Linking.openURL(url);
  }
}
