# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2024

### Added

- **React Native CLI Support**: Package now works in both Expo and React Native CLI projects
- Platform adapter system that automatically detects the environment
- Support for `react-native-fs` as an alternative to `expo-file-system`
- Automatic environment detection - no configuration needed

### Changed

- Peer dependencies are now optional (Expo deps for Expo, RN deps for React Native CLI)
- Package description updated to mention both platforms
- Core functionality refactored to use platform adapters

### Backward Compatibility

✅ **Fully backward compatible** for Expo users
- No API changes
- All existing code continues to work
- Expo dependencies automatically detected and used

### For Expo Users

No changes required! Continue using:
```bash
npm install umva-appstore-connect
npx expo install expo-file-system expo-intent-launcher expo-linking
```

### For React Native CLI Users

New support! Install with:
```bash
npm install umva-appstore-connect react-native-fs
```

Add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />
```

## [1.0.0] - 2024

### Initial Release

- Expo support
- Update checking via backend API
- APK download with progress tracking
- APK installation
- Mandatory & optional updates
- TypeScript support
- Complete test suite
