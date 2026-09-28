/**
 * Complete Example: App Update Modal
 * Works with both Expo and React Native CLI
 */

import React, { useEffect } from "react";
import {
  View,
  Text,
  Button,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { useAppUpdate, createAppLogin, createAppInstallation } from "umva-appstore-connect";

// For Expo:
// import Constants from "expo-constants";
// const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
// const PACKAGE_NAME = Constants.expoConfig?.android?.package ?? "";

// For React Native CLI:
const APP_VERSION = "1.0.0"; // Replace with your app version
const PACKAGE_NAME = "com.myapp"; // Your Android package name

interface UpdateModalProps {
  visible: boolean;
  state: string;
  currentVersion: string;
  latestVersion: string | null;
  mandatory: boolean;
  errorMessage: string;
  downloading: boolean;
  downloadProgress: number | null;
  onUpdateNow: () => void;
  onLater: () => void;
  onRetry: () => void;
  onOpenWebsite: () => void;
}

function UpdateModal({
  visible,
  state,
  currentVersion,
  latestVersion,
  mandatory,
  errorMessage,
  downloading,
  downloadProgress,
  onUpdateNow,
  onLater,
  onRetry,
  onOpenWebsite,
}: UpdateModalProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={mandatory ? undefined : onLater}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Title */}
          <Text style={styles.title}>
            {state === "error" ? "Update Error" : "Update Available"}
          </Text>

          {/* Version Info */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionLabel}>Current:</Text>
            <Text style={styles.versionValue}>{currentVersion}</Text>
            {latestVersion && (
              <>
                <Text style={styles.versionLabel}>Latest:</Text>
                <Text style={styles.versionValue}>{latestVersion}</Text>
              </>
            )}
          </View>

          {/* Mandatory Warning */}
          {mandatory && (
            <Text style={styles.mandatoryText}>
              ⚠️ This update is required
            </Text>
          )}

          {/* Error Message */}
          {errorMessage && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}

          {/* Download Progress */}
          {downloading && downloadProgress !== null && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Downloading: {Math.round(downloadProgress * 100)}%
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${downloadProgress * 100}%` },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Loading Indicator */}
          {downloading && <ActivityIndicator size="large" color="#007AFF" />}

          {/* Action Buttons */}
          {state === "available" && !downloading && (
            <View style={styles.buttonContainer}>
              <Button title="Update Now" onPress={onUpdateNow} />
              {!mandatory && (
                <View style={styles.buttonSpacer}>
                  <Button title="Later" onPress={onLater} color="#666" />
                </View>
              )}
              <View style={styles.buttonSpacer}>
                <Button
                  title="Open Website"
                  onPress={onOpenWebsite}
                  color="#007AFF"
                />
              </View>
            </View>
          )}

          {/* Error Actions */}
          {state === "error" && (
            <View style={styles.buttonContainer}>
              <Button title="Retry" onPress={onRetry} />
              <View style={styles.buttonSpacer}>
                <Button
                  title="Open Website"
                  onPress={onOpenWebsite}
                  color="#007AFF"
                />
              </View>
              {!mandatory && (
                <View style={styles.buttonSpacer}>
                  <Button title="Close" onPress={onLater} color="#666" />
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function App() {
  const {
    updateState,
    latestVersion,
    currentVersion,
    isMandatory,
    errorMessage,
    updateNow,
    handleLater,
    retry,
    openWebsite,
    downloading,
    downloadProgress,
  } = useAppUpdate({
    apiUrl: "https://api.example.com/check-version",
    version: APP_VERSION,
    buildType: __DEV__ ? "test" : "production",
    projectName: "MyApp",
    packageName: PACKAGE_NAME,
    websiteUrl: "https://myapp.com/download",
    checkOnLaunch: true,

    // Optional: Custom headers
    requestHeaders: {
      "Authorization": "Bearer your-token",
    },

    // Optional: Event callbacks
    onUpdateAvailable: (update) => {
      console.log("📦 Update available:", update.latestVersion);
      console.log("🔒 Mandatory:", update.mandatory);
    },
    onUpdateError: (error) => {
      console.error("❌ Update error:", error.message);
    },
    onDownloadProgress: (progress) => {
      console.log(`📥 Download: ${Math.round(progress * 100)}%`);
    },
  });

  useEffect(() => {
    const logAppLogin = async () => {
      try {
        await createAppLogin("https://api.example.com", {
          ip_address: "192.168.1.1",
          country: "BI",
          downloaded_by: "test.user",
          device_id: "12334Cs",
          longitude: "1.02",
          latitude: "2.90",
          app_product_id: 11,
          app_version: APP_VERSION,
        });
      } catch (error) {
        console.error("Failed to log app login:", error);
      }
    };

    logAppLogin();
  }, []);

  useEffect(() => {
    const logAppInstallation = async () => {
      try {
        await createAppInstallation("https://api.example.com", {
          ip_address: "192.168.1.1",
          country: "BI",
          downloaded_by: "test.user",
          device_id: "12334Cs",
          longitude: 0.12,
          latitude: 8.00,
          app_product_id: 7,
        });
      } catch (error) {
        console.error("Failed to log app installation:", error);
      }
    };

    logAppInstallation();
  }, []);

  const showModal =
    updateState === "available" ||
    updateState === "downloading" ||
    updateState === "error";

  return (
    <View style={styles.container}>
      {/* Your App Content */}
      <Text style={styles.appTitle}>My App</Text>
      <Text style={styles.appVersion}>Version {currentVersion}</Text>
      
      {Platform.OS === "android" && (
        <Text style={styles.note}>
          ✓ Automatic updates enabled
        </Text>
      )}

      {/* Update Modal */}
      <UpdateModal
        visible={showModal}
        state={updateState}
        currentVersion={currentVersion}
        latestVersion={latestVersion}
        mandatory={isMandatory}
        errorMessage={errorMessage}
        downloading={downloading}
        downloadProgress={downloadProgress}
        onUpdateNow={updateNow}
        onLater={handleLater}
        onRetry={retry}
        onOpenWebsite={openWebsite}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  appVersion: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  note: {
    fontSize: 14,
    color: "#4CAF50",
    marginTop: 20,
    textAlign: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  versionContainer: {
    marginBottom: 16,
  },
  versionLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  versionValue: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  mandatoryText: {
    fontSize: 14,
    color: "#FF9800",
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 14,
    color: "#F44336",
    textAlign: "center",
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
    color: "#666",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
  },
  buttonContainer: {
    marginTop: 8,
  },
  buttonSpacer: {
    marginTop: 12,
  },
});
