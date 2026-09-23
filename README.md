# rojma-app

Android app update checker, APK downloader, and installer for **Expo** and **React Native CLI** apps.

## Features

✅ **Expo + React Native CLI Support** - Works seamlessly in both environments  
✅ **Auto-Detection** - Automatically detects your platform, no configuration needed  
✅ **Update Checking** - Check your backend API for newer app versions  
✅ **APK Download** - Download APK files with real-time progress (0-1)  
✅ **APK Installation** - Launch Android APK installer  
✅ **Mandatory & Optional Updates** - Support both update types  
✅ **Error Handling** - Typed error classes for different scenarios  
✅ **TypeScript** - Full TypeScript support with strong typing  
✅ **Zero Hardcoding** - Everything is configurable

## Installation

### Expo Projects

```bash
npm install rojma-app
npx expo install expo-file-system expo-intent-launcher expo-linking
```

### React Native CLI Projects

```bash
npm install rojma-app react-native-fs
```

**Add to `android/app/src/main/AndroidManifest.xml`:**
```xml
<manifest>
  <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />
  <!-- ... other permissions ... -->
</manifest>
```

**Optional (for better APK installation):**
```bash
npm install react-native-send-intent
```

## Quick Start

### Expo Example

```tsx
import { useAppUpdate } from "rojma-app";
import Constants from "expo-constants";

function App() {
  const { updateState, updateNow, handleLater, downloadProgress } = useAppUpdate({
    apiUrl: "https://api.example.com/check-version",
    version: Constants.expoConfig?.version ?? "1.0.0",
    buildType: "production",
    projectName: "MyApp",
    packageName: Constants.expoConfig?.android?.package ?? "",
  });

  if (updateState === "available") {
    return (
      <View>
        <Text>Update Available!</Text>
        <Button title="Update Now" onPress={updateNow} />
        <Button title="Later" onPress={handleLater} />
      </View>
    );
  }

  return <YourApp />;
}
```

### React Native CLI Example

```tsx
import { useAppUpdate } from "rojma-app";
import { version } from "../package.json";

function App() {
  const { updateState, updateNow, handleLater, downloadProgress } = useAppUpdate({
    apiUrl: "https://api.example.com/check-version",
    version: version,
    buildType: __DEV__ ? "debug" : "production",
    projectName: "MyApp",
    packageName: "com.myapp",
  });

  if (updateState === "available") {
    return (
      <View>
        <Text>Update Available!</Text>
        <Button title="Update Now" onPress={updateNow} />
        <Button title="Later" onPress={handleLater} />
      </View>
    );
  }

  return <YourApp />;
}
```

See [example-usage.tsx](./example-usage.tsx) for a complete example with a modal UI.

## API

### useAppUpdate(config)

```typescript
const {
  updateState,        // "idle" | "checking" | "hidden" | "available" | "downloading" | "error"
  latestVersion,      // string | null
  currentVersion,     // string
  isMandatory,        // boolean
  errorMessage,       // string
  error,             // Error | null
  response,          // AppUpdateResponse | null
  checkForUpdate,    // () => Promise<void>
  updateNow,         // () => Promise<void>
  openWebsite,       // () => Promise<void>
  handleLater,       // () => void
  retry,            // () => Promise<void>
  downloading,      // boolean
  downloadProgress, // number | null (0-1)
} = useAppUpdate(config);
```

### Configuration

```typescript
interface AppUpdateConfig {
  apiUrl: string;                 // Backend endpoint (POST)
  version: string;                // Current app version
  buildType: string;              // "production", "staging", etc.
  projectName: string;            // Project name for backend
  packageName: string;            // Android package name
  websiteUrl?: string;            // Fallback website URL
  cacheFileName?: string;         // Cache file prefix
  requestHeaders?: Record<string, string>;  // Custom headers
  checkOnLaunch?: boolean;        // Auto-check on mount (default: true)
  onUpdateAvailable?: (update: AppUpdateResponse) => void;
  onUpdateError?: (error: Error) => void;
  onDownloadProgress?: (progress: number) => void;
}
```

## Backend Integration

### Request (Sent to your API)

```json
{
  "version": "1.0.0",
  "buildType": "production",
  "projectName": "MyApp",
  "packageName": "com.myapp"
}
```

### Response (Your API should return)

```json
{
  "updateAvailable": true,
  "latestVersion": "1.2.0",
  "mandatory": false,
  "downloadUrl": "https://cdn.example.com/app-v1.2.0.apk",
  "websiteUrl": "https://myapp.com/download"
}
```

When no update is available:
```json
{
  "updateAvailable": false
}
```

## Common Patterns

### Download Progress

```tsx
const { downloading, downloadProgress } = useAppUpdate({
  // ... config
  onDownloadProgress: (progress) => {
    console.log(`${Math.round(progress * 100)}%`);
  },
});

// In your UI
{downloading && downloadProgress !== null && (
  <Text>Downloading: {Math.round(downloadProgress * 100)}%</Text>
)}
```

### Mandatory Updates

```tsx
const { isMandatory, handleLater } = useAppUpdate({
  // ... config
});

// Disable "Later" button for mandatory updates
<Button 
  title="Later" 
  onPress={handleLater} 
  disabled={isMandatory}
/>
```

### Error Handling

```tsx
import { NetworkError, DownloadError } from "rojma-app";

const { error, errorMessage, retry } = useAppUpdate({
  // ... config
  onUpdateError: (err) => {
    if (err instanceof NetworkError) {
      console.error("Network error:", err.statusCode);
    } else if (err instanceof DownloadError) {
      console.error("Download failed:", err.message);
    }
  },
});
```

## Error Types

```typescript
import {
  AppUpdateError,      // Base error class
  UpdateCheckError,    // Update check failed
  DownloadError,       // APK download failed
  InstallationError,   // APK installation failed
  NetworkError,        // Network request failed
  ValidationError,     // Response validation failed
} from "rojma-app";
```

## Platform Differences

The package automatically detects your environment and uses the appropriate APIs:

| Feature | Expo | React Native CLI |
|---------|------|------------------|
| File System | expo-file-system | react-native-fs |
| APK Install | expo-intent-launcher | Native Linking |
| URL Opening | expo-linking | React Native Linking |

**Your code is identical on both platforms!** The adapter pattern handles all platform differences automatically.

## TypeScript

Full TypeScript support with exported types:

```typescript
import type {
  AppUpdateConfig,
  AppUpdateResponse,
  UpdateState,
  UseAppUpdateReturn,
} from "rojma-app";
```

## Troubleshooting

### "expo-file-system is not installed"
You're using Expo. Install: `npx expo install expo-file-system expo-intent-launcher expo-linking`

### "react-native-fs is not installed"
You're using React Native CLI. Install: `npm install react-native-fs`

### APK installation fails (React Native CLI)
- Ensure `REQUEST_INSTALL_PACKAGES` permission is in `AndroidManifest.xml`
- Optionally install `react-native-send-intent` for better support

### Permission denied
Ensure the permission is added to `android/app/src/main/AndroidManifest.xml`

## Requirements

- React Native 0.72+
- Android only (iOS does not support APK installation)
- **Expo**: SDK 50+
- **React Native CLI**: `react-native-fs` package

## License

MIT

## More Information

- [CHANGELOG.md](./CHANGELOG.md) - Version history
- [example-usage.tsx](./example-usage.tsx) - Complete example with UI
