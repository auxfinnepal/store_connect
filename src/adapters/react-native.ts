/**
 * React Native CLI platform adapter
 * Uses @react-native-community/netinfo, react-native-fs, and react-native Linking
 */

import { Platform, Linking as RNLinking, NativeModules, PermissionsAndroid } from "react-native";
import {
  FileSystemAdapter,
  IntentLauncherAdapter,
  LinkingAdapter,
  DownloadOptions,
  DownloadResult,
  FileInfo,
} from "./types";

let RNFS: any;

try {
  RNFS = require("react-native-fs");
} catch (error) {
  // react-native-fs not available
}

export class RNFileSystemAdapter implements FileSystemAdapter {
  async downloadFile(options: DownloadOptions): Promise<DownloadResult> {
    if (!RNFS) {
      throw new Error(
        "react-native-fs is not installed. Install it with: npm install react-native-fs"
      );
    }

    const { url, destination, onProgress } = options;
    const fileName = destination.split("/").pop() || "download.apk";
    const localPath = `${RNFS.CachesDirectoryPath}/${fileName}`;


    const downloadResult = RNFS.downloadFile({
      fromUrl: url,
      toFile: localPath,
      progress: (res: any) => {
        if (onProgress && res.contentLength > 0) {
          const progress = res.bytesWritten / res.contentLength;
          const normalizedProgress = Math.max(0, Math.min(1, progress));
          onProgress(normalizedProgress);
        }
      },
    });

    const result = await downloadResult.promise;

    if (result.statusCode !== 200) {
      throw new Error(`Download failed with status code: ${result.statusCode}`);
    }

   

    // Verify file exists
    const exists = await RNFS.exists(localPath);
    if (!exists) {
      throw new Error("Downloaded APK is missing");
    }

    const stat = await RNFS.stat(localPath);
    if (stat.size === 0) {
      throw new Error("Downloaded APK is empty");
    }

   

    // For React Native, content URI is created via native module or file URI
    const contentUri = Platform.OS === "android" ? `file://${localPath}` : localPath;
    
   

    return {
      localUri: localPath,
      contentUri,
    };
  }

  async getFileInfo(uri: string): Promise<FileInfo> {
    if (!RNFS) {
      throw new Error("react-native-fs is not installed");
    }

    const cleanUri = uri.replace("file://", "");
    const exists = await RNFS.exists(cleanUri);

    if (!exists) {
      return { exists: false, uri };
    }

    const stat = await RNFS.stat(cleanUri);
    return {
      exists: true,
      size: stat.size,
      uri,
    };
  }

  getCacheDirectory(): string {
    if (!RNFS) {
      throw new Error("react-native-fs is not installed");
    }
    return RNFS.CachesDirectoryPath;
  }
}

export class RNIntentLauncherAdapter implements IntentLauncherAdapter {
  async startActivity(
    _action: string,
    options: { data: string; type: string; flags: number }
  ): Promise<void> {
    if (Platform.OS !== "android") {
      throw new Error("Intent launcher is only supported on Android");
    }

   

    // Request install packages permission for Android 8.0+
    if (Platform.Version >= 26) {
      try {
        const granted = await PermissionsAndroid.request(
          "android.permission.REQUEST_INSTALL_PACKAGES" as any,
          {
            title: "Install Permission Required",
            message: "This app needs permission to install updates",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn("[rojma-app-update] ⚠️ Install permission not granted");
        }
      } catch (err) {
        console.warn("[rojma-app-update] ⚠️ Permission request error:", err);
      }
    }

    // Use native Android intent to open APK installer
    try {
      // Try to use SendIntentAndroid if available
      const SendIntentAndroid = NativeModules.SendIntentAndroid;
      if (SendIntentAndroid && SendIntentAndroid.openFileChooser) {
        await SendIntentAndroid.openFileChooser(
          options.data.replace("file://", ""),
          options.type
        );
        
        return;
      }
    } catch (error) {
      console.warn("[rojma-app-update] ⚠️ SendIntentAndroid not available, trying Linking");
    }

    // Fallback to Linking API
    const canOpen = await RNLinking.canOpenURL(options.data);
    if (canOpen) {
      await RNLinking.openURL(options.data);
      
    } else {
      throw new Error(
        "Cannot open APK installer. You may need to install react-native-send-intent or a similar package for APK installation support."
      );
    }
  }
}

export class RNLinkingAdapter implements LinkingAdapter {
  async canOpenURL(url: string): Promise<boolean> {
    return await RNLinking.canOpenURL(url);
  }

  async openURL(url: string): Promise<void> {
    await RNLinking.openURL(url);
  }
}
