import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from "react-native";
import type { UpdateState } from "../types";

export interface UpdateAvailableModalProps {
  /**
   * Current update state
   */
  state: UpdateState;

  /**
   * Current app version
   */
  currentVersion: string;

  /**
   * Latest available version
   */
  latestVersion: string | null;

  /**
   * Whether the update is mandatory
   */
  mandatory: boolean;

  /**
   * Error message to display
   */
  errorMessage?: string;

  /**
   * Callback when user clicks "Update Now"
   */
  onUpdateNow: () => void;

  /**
   * Callback when user clicks "Later" (dismisses modal)
   */
  onLater: () => void;

  /**
   * Callback when user clicks "Retry" after an error
   */
  onRetry: () => void;

  /**
   * Callback when user clicks "Open Website"
   */
  onOpenWebsite?: () => void;

  /**
   * Whether download is in progress
   */
  downloading: boolean;

  /**
   * Download progress (0-1), null if unavailable
   */
  downloadProgress: number | null;

  /**
   * Custom styles for the modal overlay
   */
  overlayStyle?: ViewStyle;

  /**
   * Custom styles for the modal container
   */
  modalStyle?: ViewStyle;

  /**
   * Custom styles for the title
   */
  titleStyle?: TextStyle;

  /**
   * Custom styles for text
   */
  textStyle?: TextStyle;

  /**
   * Custom styles for primary button
   */
  primaryButtonStyle?: ViewStyle;

  /**
   * Custom styles for secondary button
   */
  secondaryButtonStyle?: ViewStyle;

  /**
   * Custom styles for primary button text
   */
  primaryButtonTextStyle?: TextStyle;

  /**
   * Custom styles for secondary button text
   */
  secondaryButtonTextStyle?: TextStyle;

  /**
   * Custom text overrides
   */
  text?: {
    updateAvailableTitle?: string;
    errorTitle?: string;
    checkingTitle?: string;
    currentVersion?: string;
    latestVersion?: string;
    mandatoryMessage?: string;
    updateNowButton?: string;
    laterButton?: string;
    retryButton?: string;
    openWebsiteButton?: string;
    downloadingMessage?: string;
    downloadingProgress?: (progress: number) => string;
  };
}

/**
 * A customizable modal component for displaying app update notifications.
 * Supports optional and mandatory updates, progress tracking, and error states.
 *
 * @example
 * ```tsx
 * <UpdateAvailableModal
 *   state={updateState}
 *   currentVersion="1.0.0"
 *   latestVersion="2.0.0"
 *   mandatory={false}
 *   onUpdateNow={handleUpdate}
 *   onLater={handleLater}
 *   onRetry={handleRetry}
 *   downloading={false}
 *   downloadProgress={null}
 * />
 * ```
 */
export function UpdateAvailableModal({
  state,
  currentVersion,
  latestVersion,
  mandatory,
  errorMessage,
  onUpdateNow,
  onLater,
  onRetry,
  onOpenWebsite,
  downloading,
  downloadProgress,
  overlayStyle,
  modalStyle,
  titleStyle,
  textStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  primaryButtonTextStyle,
  secondaryButtonTextStyle,
  text = {},
}: UpdateAvailableModalProps): JSX.Element | null {
  // Don't show modal for idle and hidden states
  const isVisible = state !== "idle" && state !== "hidden";

  if (!isVisible) {
    return null;
  }

  const getTitle = (): string => {
    if (state === "error") {
      return text.errorTitle || "Update Error";
    }
    if (state === "checking") {
      return text.checkingTitle || "Checking for Updates...";
    }
    return text.updateAvailableTitle || "Update Available";
  };

  const renderVersionInfo = () => {
    if (state === "checking" || state === "error") {
      return null;
    }

    return (
      <View style={styles.versionInfo}>
        <Text style={[styles.versionText, textStyle]}>
          {text.currentVersion || "Current Version"}: {currentVersion}
        </Text>
        {latestVersion && (
          <Text style={[styles.versionText, textStyle]}>
            {text.latestVersion || "Latest Version"}: {latestVersion}
          </Text>
        )}
      </View>
    );
  };

  const renderMandatoryBadge = () => {
    if (!mandatory || state === "error" || state === "checking") {
      return null;
    }

    return (
      <View style={styles.mandatoryBadge}>
        <Text style={styles.mandatoryText}>
          ⚠️ {text.mandatoryMessage || "This update is required"}
        </Text>
      </View>
    );
  };

  const renderErrorMessage = () => {
    if (!errorMessage) {
      return null;
    }

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    );
  };

  const renderProgressBar = () => {
    if (!downloading || downloadProgress === null) {
      return null;
    }

    const progressPercentage = Math.round(downloadProgress * 100);
    const progressText = text.downloadingProgress
      ? text.downloadingProgress(progressPercentage)
      : `Downloading: ${progressPercentage}%`;

    return (
      <View style={styles.progressContainer}>
        <Text style={[styles.progressText, textStyle]}>{progressText}</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercentage}%` },
            ]}
          />
        </View>
      </View>
    );
  };

  const renderLoadingIndicator = () => {
    if (state === "checking") {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }

    if (downloading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={[styles.downloadingText, textStyle]}>
            {text.downloadingMessage || "Please wait..."}
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderButtons = () => {
    if (state === "checking") {
      return null;
    }

    if (state === "available" || state === "downloading") {
      return (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              primaryButtonStyle,
              downloading && styles.buttonDisabled,
            ]}
            onPress={onUpdateNow}
            disabled={downloading}
            testID="update-now-button"
          >
            <Text style={[styles.primaryButtonText, primaryButtonTextStyle]}>
              {text.updateNowButton || "Update Now"}
            </Text>
          </TouchableOpacity>

          {!mandatory && (
            <TouchableOpacity
              style={[
                styles.button,
                styles.secondaryButton,
                secondaryButtonStyle,
                downloading && styles.buttonDisabled,
              ]}
              onPress={onLater}
              disabled={downloading}
              testID="later-button"
            >
              <Text style={[styles.secondaryButtonText, secondaryButtonTextStyle]}>
                {text.laterButton || "Later"}
              </Text>
            </TouchableOpacity>
          )}

          {onOpenWebsite && (
            <TouchableOpacity
              style={[
                styles.button,
                styles.secondaryButton,
                secondaryButtonStyle,
                downloading && styles.buttonDisabled,
              ]}
              onPress={onOpenWebsite}
              disabled={downloading}
              testID="open-website-button"
            >
              <Text style={[styles.secondaryButtonText, secondaryButtonTextStyle]}>
                {text.openWebsiteButton || "Open Website"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (state === "error") {
      return (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, primaryButtonStyle]}
            onPress={onRetry}
            testID="retry-button"
          >
            <Text style={[styles.primaryButtonText, primaryButtonTextStyle]}>
              {text.retryButton || "Retry"}
            </Text>
          </TouchableOpacity>

          {onOpenWebsite && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, secondaryButtonStyle]}
              onPress={onOpenWebsite}
              testID="open-website-button"
            >
              <Text style={[styles.secondaryButtonText, secondaryButtonTextStyle]}>
                {text.openWebsiteButton || "Open Website"}
              </Text>
            </TouchableOpacity>
          )}

          {!mandatory && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, secondaryButtonStyle]}
              onPress={onLater}
              testID="close-button"
            >
              <Text style={[styles.secondaryButtonText, secondaryButtonTextStyle]}>
                Close
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={mandatory ? undefined : onLater}
      testID="update-modal"
    >
      <View style={[styles.overlay, overlayStyle]}>
        <View style={[styles.modal, modalStyle]}>
          {/* Title */}
          <Text style={[styles.title, titleStyle]}>{getTitle()}</Text>

          {/* Version Info */}
          {renderVersionInfo()}

          {/* Mandatory Badge */}
          {renderMandatoryBadge()}

          {/* Error Message */}
          {renderErrorMessage()}

          {/* Progress Bar */}
          {renderProgressBar()}

          {/* Loading Indicator */}
          {renderLoadingIndicator()}

          {/* Action Buttons */}
          {renderButtons()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#000",
  },
  versionInfo: {
    marginBottom: 16,
  },
  versionText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  mandatoryBadge: {
    backgroundColor: "#FFF3CD",
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFE69C",
  },
  mandatoryText: {
    color: "#856404",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
  errorContainer: {
    backgroundColor: "#F8D7DA",
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F5C2C7",
  },
  errorText: {
    color: "#842029",
    fontSize: 14,
    textAlign: "center",
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 4,
  },
  loadingContainer: {
    marginVertical: 16,
    alignItems: "center",
  },
  downloadingText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 16,
    gap: 12,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
