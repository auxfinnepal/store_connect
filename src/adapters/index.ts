/**
 * Platform adapter factory
 * Automatically detects and returns the appropriate adapter (Expo or React Native CLI)
 */

import { PlatformAdapter } from "./types";
import {
  ExpoFileSystemAdapter,
  ExpoIntentLauncherAdapter,
  ExpoLinkingAdapter,
} from "./expo";
import {
  RNFileSystemAdapter,
  RNIntentLauncherAdapter,
  RNLinkingAdapter,
} from "./react-native";

export * from "./types";

/**
 * Detect if running in Expo environment
 */
function isExpoEnvironment(): boolean {
  try {
    // Check if expo-file-system is available
    require("expo-file-system");
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the appropriate platform adapter based on the environment
 */
export function getPlatformAdapter(): PlatformAdapter {
  const isExpo = isExpoEnvironment();

  if (isExpo) {
    return {
      fileSystem: new ExpoFileSystemAdapter(),
      intentLauncher: new ExpoIntentLauncherAdapter(),
      linking: new ExpoLinkingAdapter(),
    };
  } else {
    return {
      fileSystem: new RNFileSystemAdapter(),
      intentLauncher: new RNIntentLauncherAdapter(),
      linking: new RNLinkingAdapter(),
    };
  }
}

/**
 * Singleton instance of the platform adapter
 */
let platformAdapter: PlatformAdapter | null = null;

/**
 * Get or create the platform adapter instance
 */
export function getPlatformAdapterInstance(): PlatformAdapter {
  if (!platformAdapter) {
    platformAdapter = getPlatformAdapter();
  }
  return platformAdapter;
}

/**
 * Reset the platform adapter instance (useful for testing)
 */
export function resetPlatformAdapter(): void {
  platformAdapter = null;
}
