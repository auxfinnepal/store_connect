export interface AppUpdateConfig {
  apiUrl: string;
  version: string;
  buildType: string;
  projectName: string;
  packageName: string;
  websiteUrl?: string;
  cacheFileName?: string;
  requestHeaders?: Record<string, string>;
  checkOnLaunch?: boolean;
  onUpdateAvailable?: (update: AppUpdateResponse) => void;
  onUpdateError?: (error: Error) => void;
  onDownloadProgress?: (progress: number) => void;
}

export interface AppUpdateResponse {
  updateAvailable: boolean;
  latestVersion?: string;
  mandatory?: boolean;
  downloadUrl?: string;
  websiteUrl?: string;
  [key: string]: unknown;
}

export type UpdateState = "idle" | "checking" | "hidden" | "available" | "downloading" | "error";

export interface UseAppUpdateReturn {
  updateState: UpdateState;
  latestVersion: string | null;
  currentVersion: string;
  isMandatory: boolean;
  errorMessage: string;
  error: Error | null;
  response: AppUpdateResponse | null;
  checkForUpdate: () => Promise<void>;
  updateNow: () => Promise<void>;
  openWebsite: () => Promise<void>;
  handleLater: () => void;
  retry: () => Promise<void>;
  downloading: boolean;
  downloadProgress: number | null;
}