import { render, fireEvent } from "@testing-library/react";
import { UpdateAvailableModal } from "../components/UpdateAvailableModal";
import type { UpdateState } from "../types";

describe("UpdateAvailableModal", () => {
  const defaultProps = {
    currentVersion: "1.0.0",
    latestVersion: "2.0.0",
    mandatory: false,
    errorMessage: "",
    onUpdateNow: jest.fn(),
    onLater: jest.fn(),
    onRetry: jest.fn(),
    onOpenWebsite: jest.fn(),
    downloading: false,
    downloadProgress: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("visibility", () => {
    it("should not render when state is idle", () => {
      const { queryByTestId } = render(
        <UpdateAvailableModal {...defaultProps} state="idle" />
      );

      expect(queryByTestId("update-modal")).toBeNull();
    });

    it("should not render when state is hidden", () => {
      const { queryByTestId } = render(
        <UpdateAvailableModal {...defaultProps} state="hidden" />
      );

      expect(queryByTestId("update-modal")).toBeNull();
    });

    it("should render when state is checking", () => {
      const { getByTestId } = render(
        <UpdateAvailableModal {...defaultProps} state="checking" />
      );

      expect(getByTestId("update-modal")).toBeTruthy();
    });

    it("should render when state is available", () => {
      const { getByTestId } = render(
        <UpdateAvailableModal {...defaultProps} state="available" />
      );

      expect(getByTestId("update-modal")).toBeTruthy();
    });

    it("should render when state is downloading", () => {
      const { getByTestId } = render(
        <UpdateAvailableModal {...defaultProps} state="downloading" />
      );

      expect(getByTestId("update-modal")).toBeTruthy();
    });

    it("should render when state is error", () => {
      const { getByTestId } = render(
        <UpdateAvailableModal {...defaultProps} state="error" />
      );

      expect(getByTestId("update-modal")).toBeTruthy();
    });
  });

  describe("titles", () => {
    it("should show default update available title", () => {
      const { getByText } = render(
        <UpdateAvailableModal {...defaultProps} state="available" />
      );

      expect(getByText("Update Available")).toBeTruthy();
    });

    it("should show custom update available title", () => {
      const { getByText } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="available"
          text={{ updateAvailableTitle: "New Version Ready" }}
        />
      );

      expect(getByText("New Version Ready")).toBeTruthy();
    });

    it("should show default error title", () => {
      const { getByText } = render(
        <UpdateAvailableModal {...defaultProps} state="error" />
      );

      expect(getByText("Update Error")).toBeTruthy();
    });

    it("should show custom error title", () => {
      const { getByText } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="error"
          text={{ errorTitle: "Oops! Something Went Wrong" }}
        />
      );

      expect(getByText("Oops! Something Went Wrong")).toBeTruthy();
    });

    it("should show default checking title", () => {
      const { getByText } = render(
        <UpdateAvailableModal {...defaultProps} state="checking" />
      );

      expect(getByText("Checking for Updates...")).toBeTruthy();
    });

    it("should show custom checking title", () => {
      const { getByText } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="checking"
          text={{ checkingTitle: "Looking for Updates" }}
        />
      );

      expect(getByText("Looking for Updates")).toBeTruthy();
    });
  });

  describe("version information", () => {
    it("should show current and latest version", () => {
      const { getByText } = render(
        <UpdateAvailableModal {...defaultProps} state="available" />
      );

      expect(getByText(/Current Version: 1\.0\.0/)).toBeTruthy();
      expect(getByText(/Latest Version: 2\.0\.0/)).toBeTruthy();
    });

    it("should show current version only when latest is null", () => {
      const { getByText, queryByText } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="available"
          latestVersion={null}
        />
      );

      expect(getByText(/Current Version: 1\.0\.0/)).toBeTruthy();
      expect(queryByText(/Latest Version/)).toBeNull();
    });

    it("should not show version info in checking state", () => {
      const { queryByText } = render(
        <UpdateAvailableModal {...defaultProps} state="checking" />
      );

      expect(queryByText(/Current Version/)).toBeNull();
      expect(queryByText(/Latest Version/)).toBeNull();
    });

    it("should not show version info in error state", () => {
      const { queryByText } = render(
        <UpdateAvailableModal {...defaultProps} state="error" />
      );

      expect(queryByText(/Current Version/)).toBeNull();
      expect(queryByText(/Latest Version/)).toBeNull();
    });

    it("should use custom version text", () => {
      const { getByText } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="available"
          text={{
            currentVersion: "You have",
            latestVersion: "Available",
          }}
        />
      );

      expect(getByText(/You have: 1\.0\.0/)).toBeTruthy();
      expect(getByText(/Available: 2\.0\.0/)).toBeTruthy();
    });
  });

  describe("mandatory updates", () => {
    it("should show mandatory badge for mandatory updates", () => {
      const { getByText } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="available"
          mandatory={true}
        />
      );

      expect(getByText(/This update is required/)).toBeTruthy();
    });

    it("should not show mandatory badge for optional updates", () => {
      const { queryByText } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="available"
          mandatory={false}
        />
      );

      expect(queryByText(/This update is required/)).toBeNull();
    });

    it("should use custom mandatory message", () => {
      const { getByText } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="available"
          mandatory={true}
          text={{ mandatoryMessage: "You must update to continue" }}
        />
      );

      expect(getByText(/You must update to continue/)).toBeTruthy();
    });

    it("should not show Later button for mandatory updates", () => {
      const { queryByTestId } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="available"
          mandatory={true}
        />
      );

      expect(queryByTestId("later-button")).toBeNull();
    });

    it("should show Later button for optional updates", () => {
      const { getByTestId } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="available"
          mandatory={false}
        />
      );

      expect(getByTestId("later-button")).toBeTruthy();
    });
  });

  describe("error messages", () => {
    it("should display error message when provided", () => {
      const { getByText } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="error"
          errorMessage="Network connection failed"
        />
      );

      expect(getByText("Network connection failed")).toBeTruthy();
    });

    it("should not display error container when no error message", () => {
      const { queryByText } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="available"
          errorMessage=""
        />
      );

      // Error container should not be in the document
      expect(queryByText(/Network/)).toBeNull();
    });
  });

  describe("download progress", () => {
    it("should show progress bar when downloading", () => {
      const { getByText } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="downloading"
          downloading={true}
          downloadProgress={0.5}
        />
      );

      expect(getByText("Downloading: 50%")).toBeTruthy();
    });

    it("should not show progress bar when not downloading", () => {
      const { queryByText } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="available"
          downloading={false}
          downloadProgress={null}
        />
      );

      expect(queryByText(/Downloading/)).toBeNull();
    });

    it("should not show progress bar when downloadProgress is null", () => {
      const { queryByText } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="downloading"
          downloading={true}
          downloadProgress={null}
        />
      );

      expect(queryByText(/Downloading:/)).toBeNull();
    });

    it("should show 0% progress", () => {
      const { getByText } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="downloading"
          downloading={true}
          downloadProgress={0}
        />
      );

      expect(getByText("Downloading: 0%")).toBeTruthy();
    });

    it("should show 100% progress", () => {
      const { getByText } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="downloading"
          downloading={true}
          downloadProgress={1}
        />
      );

      expect(getByText("Downloading: 100%")).toBeTruthy();
    });

    it("should use custom progress text formatter", () => {
      const { getByText } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="downloading"
          downloading={true}
          downloadProgress={0.75}
          text={{
            downloadingProgress: (progress) => `${progress}% complete`,
          }}
        />
      );

      expect(getByText("75% complete")).toBeTruthy();
    });
  });

  describe("loading indicators", () => {
    it("should show activity indicator when checking", () => {
      const { getByTestId } = render(
        <UpdateAvailableModal {...defaultProps} state="checking" />
      );

      // ActivityIndicator should be rendered
      expect(getByTestId("update-modal")).toBeTruthy();
    });

    it("should show downloading message when downloading", () => {
      const { getByText } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="downloading"
          downloading={true}
          downloadProgress={0.5}
        />
      );

      expect(getByText("Please wait...")).toBeTruthy();
    });

    it("should use custom downloading message", () => {
      const { getByText } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="downloading"
          downloading={true}
          downloadProgress={0.5}
          text={{ downloadingMessage: "Installing update..." }}
        />
      );

      expect(getByText("Installing update...")).toBeTruthy();
    });
  });

  describe("buttons - available state", () => {
    it("should render Update Now button", () => {
      const { getByTestId } = render(
        <UpdateAvailableModal {...defaultProps} state="available" />
      );

      expect(getByTestId("update-now-button")).toBeTruthy();
    });

    it("should call onUpdateNow when Update Now button is pressed", () => {
      const onUpdateNow = jest.fn();
      const { getByTestId } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="available"
          onUpdateNow={onUpdateNow}
        />
      );

      fireEvent.click(getByTestId("update-now-button"));

      expect(onUpdateNow).toHaveBeenCalledTimes(1);
    });

    it("should disable Update Now button when downloading", () => {
      const { getByTestId } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="downloading"
          downloading={true}
          downloadProgress={0.5}
        />
      );

      const button = getByTestId("update-now-button");
      expect(button).toBeDisabled();
    });

    it("should call onLater when Later button is pressed", () => {
      const onLater = jest.fn();
      const { getByTestId } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="available"
          onLater={onLater}
          mandatory={false}
        />
      );

      fireEvent.click(getByTestId("later-button"));

      expect(onLater).toHaveBeenCalledTimes(1);
    });

    it("should render Open Website button when callback provided", () => {
      const { getByTestId } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="available"
          onOpenWebsite={jest.fn()}
        />
      );

      expect(getByTestId("open-website-button")).toBeTruthy();
    });

    it("should call onOpenWebsite when Open Website button is pressed", () => {
      const onOpenWebsite = jest.fn();
      const { getByTestId } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="available"
          onOpenWebsite={onOpenWebsite}
        />
      );

      fireEvent.click(getByTestId("open-website-button"));

      expect(onOpenWebsite).toHaveBeenCalledTimes(1);
    });

    it("should not render Open Website button when callback not provided", () => {
      const { queryByTestId } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="available"
          onOpenWebsite={undefined}
        />
      );

      expect(queryByTestId("open-website-button")).toBeNull();
    });

    it("should use custom button text", () => {
      const { getByText } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="available"
          text={{
            updateNowButton: "Install Now",
            laterButton: "Remind Me Later",
            openWebsiteButton: "Visit Website",
          }}
        />
      );

      expect(getByText("Install Now")).toBeTruthy();
      expect(getByText("Remind Me Later")).toBeTruthy();
      expect(getByText("Visit Website")).toBeTruthy();
    });
  });

  describe("buttons - error state", () => {
    it("should render Retry button in error state", () => {
      const { getByTestId } = render(
        <UpdateAvailableModal {...defaultProps} state="error" />
      );

      expect(getByTestId("retry-button")).toBeTruthy();
    });

    it("should call onRetry when Retry button is pressed", () => {
      const onRetry = jest.fn();
      const { getByTestId } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="error"
          onRetry={onRetry}
        />
      );

      fireEvent.click(getByTestId("retry-button"));

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("should render Close button in error state for optional updates", () => {
      const { getByTestId } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="error"
          mandatory={false}
        />
      );

      expect(getByTestId("close-button")).toBeTruthy();
    });

    it("should not render Close button in error state for mandatory updates", () => {
      const { queryByTestId } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="error"
          mandatory={true}
        />
      );

      expect(queryByTestId("close-button")).toBeNull();
    });

    it("should use custom retry button text", () => {
      const { getByText } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="error"
          text={{ retryButton: "Try Again" }}
        />
      );

      expect(getByText("Try Again")).toBeTruthy();
    });
  });

  describe("buttons - checking state", () => {
    it("should not render any buttons when checking", () => {
      const { queryByTestId } = render(
        <UpdateAvailableModal {...defaultProps} state="checking" />
      );

      expect(queryByTestId("update-now-button")).toBeNull();
      expect(queryByTestId("later-button")).toBeNull();
      expect(queryByTestId("retry-button")).toBeNull();
    });
  });

  describe("custom styling", () => {
    it("should apply custom overlay style", () => {
      const overlayStyle = { backgroundColor: "rgba(255, 0, 0, 0.5)" };
      const { getByTestId } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="available"
          overlayStyle={overlayStyle}
        />
      );

      // Component should render with custom styles
      expect(getByTestId("update-modal")).toBeTruthy();
    });

    it("should apply custom modal style", () => {
      const modalStyle = { backgroundColor: "#f0f0f0" };
      const { getByTestId } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="available"
          modalStyle={modalStyle}
        />
      );

      expect(getByTestId("update-modal")).toBeTruthy();
    });

    it("should apply custom title style", () => {
      const titleStyle = { color: "red", fontSize: 24 };
      const { getByText } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="available"
          titleStyle={titleStyle}
        />
      );

      expect(getByText("Update Available")).toBeTruthy();
    });
  });

  describe("integration scenarios", () => {
    it("should handle complete optional update flow", () => {
      const onUpdateNow = jest.fn();
      const onLater = jest.fn();

      const { getByTestId, getByText } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="available"
          mandatory={false}
          onUpdateNow={onUpdateNow}
          onLater={onLater}
        />
      );

      expect(getByText("Update Available")).toBeTruthy();
      expect(getByText(/Current Version: 1\.0\.0/)).toBeTruthy();
      expect(getByText(/Latest Version: 2\.0\.0/)).toBeTruthy();

      fireEvent.click(getByTestId("update-now-button"));
      expect(onUpdateNow).toHaveBeenCalled();
    });

    it("should handle complete mandatory update flow", () => {
      const onUpdateNow = jest.fn();

      const { getByTestId, getByText, queryByTestId } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="available"
          mandatory={true}
          onUpdateNow={onUpdateNow}
        />
      );

      expect(getByText("Update Available")).toBeTruthy();
      expect(getByText(/This update is required/)).toBeTruthy();
      expect(queryByTestId("later-button")).toBeNull();

      fireEvent.click(getByTestId("update-now-button"));
      expect(onUpdateNow).toHaveBeenCalled();
    });

    it("should handle downloading state with progress", () => {
      const { getByText } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="downloading"
          downloading={true}
          downloadProgress={0.75}
        />
      );

      expect(getByText("Update Available")).toBeTruthy();
      expect(getByText("Downloading: 75%")).toBeTruthy();
      expect(getByText("Please wait...")).toBeTruthy();
    });

    it("should handle error state with retry", () => {
      const onRetry = jest.fn();

      const { getByTestId, getByText } = render(
        <UpdateAvailableModal
          {...defaultProps}
          state="error"
          errorMessage="Network connection failed"
          onRetry={onRetry}
        />
      );

      expect(getByText("Update Error")).toBeTruthy();
      expect(getByText("Network connection failed")).toBeTruthy();

      fireEvent.click(getByTestId("retry-button"));
      expect(onRetry).toHaveBeenCalled();
    });
  });
});
