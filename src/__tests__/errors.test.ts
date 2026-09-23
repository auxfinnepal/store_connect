import {
  AppUpdateError,
  UpdateCheckError,
  DownloadError,
  InstallationError,
  NetworkError,
  ValidationError,
} from "../errors";

describe("Error Classes", () => {
  describe("AppUpdateError", () => {
    it("should create error with message", () => {
      const error = new AppUpdateError("Test error");
      expect(error.message).toBe("Test error");
      expect(error.name).toBe("AppUpdateError");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppUpdateError);
    });

    it("should store cause", () => {
      const cause = new Error("Original error");
      const error = new AppUpdateError("Wrapped error", cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe("UpdateCheckError", () => {
    it("should create error with correct name", () => {
      const error = new UpdateCheckError("Update check failed");
      expect(error.message).toBe("Update check failed");
      expect(error.name).toBe("UpdateCheckError");
      expect(error).toBeInstanceOf(AppUpdateError);
    });

    it("should store cause", () => {
      const cause = new Error("Network timeout");
      const error = new UpdateCheckError("Failed to check", cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe("DownloadError", () => {
    it("should create error with correct name", () => {
      const error = new DownloadError("Download failed");
      expect(error.message).toBe("Download failed");
      expect(error.name).toBe("DownloadError");
      expect(error).toBeInstanceOf(AppUpdateError);
    });
  });

  describe("InstallationError", () => {
    it("should create error with correct name", () => {
      const error = new InstallationError("Installation failed");
      expect(error.message).toBe("Installation failed");
      expect(error.name).toBe("InstallationError");
      expect(error).toBeInstanceOf(AppUpdateError);
    });
  });

  describe("NetworkError", () => {
    it("should create error with status code", () => {
      const error = new NetworkError("Request failed", 404);
      expect(error.message).toBe("Request failed");
      expect(error.name).toBe("NetworkError");
      expect(error.statusCode).toBe(404);
      expect(error).toBeInstanceOf(AppUpdateError);
    });

    it("should work without status code", () => {
      const error = new NetworkError("Request failed");
      expect(error.statusCode).toBeUndefined();
    });
  });

  describe("ValidationError", () => {
    it("should create error with correct name", () => {
      const error = new ValidationError("Invalid data");
      expect(error.message).toBe("Invalid data");
      expect(error.name).toBe("ValidationError");
      expect(error).toBeInstanceOf(AppUpdateError);
    });
  });
});
