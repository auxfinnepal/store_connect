/**
 * TypeScript Types Reference
 *
 * This file provides a convenient single import location for all types.
 * Import from here when you only need type definitions without implementations.
 *
 * @example
 * ```typescript
 * import type {
 *   AppUpdateConfig,
 *   UpdateState,
 *   UpdateAvailableModalProps
 * } from 'rojma-app/types-reference';
 * ```
 */

// Re-export all types from main types file
export type {
  AppUpdateConfig,
  AppUpdateResponse,
  UpdateState,
  UseAppUpdateReturn,
} from "./types";

// Re-export component props
export type { UpdateAvailableModalProps } from "./components/UpdateAvailableModal";

// Re-export API types
export type { CheckUpdateParams } from "./appUpdateService";

// Re-export error classes (for instanceof checks)
export {
  AppUpdateError,
  DownloadError,
  InstallationError,
  NetworkError,
  UpdateCheckError,
  ValidationError,
} from "./errors";
