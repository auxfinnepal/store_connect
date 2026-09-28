export { useAppUpdate } from "./useAppUpdate";
export { AppUpdateService } from "./appUpdateService";
export { createAppLogin } from "./appLoginService";
export { createAppInstallation } from "./appInstallationService";
export { downloadApk, installApk, downloadAndInstallApk } from "./utils/apk";
export { UpdateAvailableModal } from "./components/UpdateAvailableModal";
export { getPlatformAdapter, getPlatformAdapterInstance, resetPlatformAdapter } from "./adapters";

export type {
  AppUpdateConfig,
  AppUpdateResponse,
  UpdateState,
  UseAppUpdateReturn,
} from "./types";

export type {
  DownloadApkOptions,
  DownloadApkResult,
} from "./utils/apk";

export type {
  CheckUpdateParams,
} from "./appUpdateService";

export type {
  CreateAppLoginParams,
  AppLoginResponse,
} from "./appLoginService";

export type {
  CreateAppInstallationParams,
  AppInstallationResponse,
} from "./appInstallationService";

export type {
  UpdateAvailableModalProps,
} from "./components/UpdateAvailableModal";

export type {
  PlatformAdapter,
  FileSystemAdapter,
  IntentLauncherAdapter,
  LinkingAdapter,
  DownloadOptions,
  DownloadResult,
  FileInfo,
} from "./adapters";

export {
  AppUpdateError,
  UpdateCheckError,
  DownloadError,
  InstallationError,
  NetworkError,
  ValidationError,
  AppLoginError,
  AppInstallationError,
} from "./errors";

export { validateUrl, validateUpdateResponse, validateConfig } from "./utils/validation";
