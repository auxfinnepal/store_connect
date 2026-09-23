/**
 * Platform adapter types for cross-platform support (Expo + React Native CLI)
 */

export interface DownloadOptions {
  url: string;
  destination: string;
  onProgress?: (progress: number) => void;
}

export interface DownloadResult {
  localUri: string;
  contentUri: string;
}

export interface FileInfo {
  exists: boolean;
  size?: number;
  uri: string;
}

/**
 * File system adapter interface
 */
export interface FileSystemAdapter {
  downloadFile(options: DownloadOptions): Promise<DownloadResult>;
  getFileInfo(uri: string): Promise<FileInfo>;
  getCacheDirectory(): string;
}

/**
 * Intent launcher adapter interface (Android-specific)
 */
export interface IntentLauncherAdapter {
  startActivity(action: string, options: {
    data: string;
    type: string;
    flags: number;
  }): Promise<void>;
}

/**
 * Linking adapter interface
 */
export interface LinkingAdapter {
  canOpenURL(url: string): Promise<boolean>;
  openURL(url: string): Promise<void>;
}

/**
 * Platform adapter that provides all platform-specific functionality
 */
export interface PlatformAdapter {
  fileSystem: FileSystemAdapter;
  intentLauncher: IntentLauncherAdapter;
  linking: LinkingAdapter;
}
