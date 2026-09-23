import { validateUrl, validateUpdateResponse, validateConfig } from "../utils/validation";
import { ValidationError } from "../errors";

describe("validateUrl", () => {
  it("should accept valid HTTPS URLs", () => {
    expect(() => validateUrl("https://example.com")).not.toThrow();
    expect(() => validateUrl("https://example.com/path")).not.toThrow();
  });

  it("should accept valid HTTP URLs", () => {
    expect(() => validateUrl("http://example.com")).not.toThrow();
  });

  it("should reject invalid URLs", () => {
    expect(() => validateUrl("not-a-url")).toThrow(ValidationError);
    expect(() => validateUrl("")).toThrow(ValidationError);
  });

  it("should reject non-HTTP(S) protocols", () => {
    expect(() => validateUrl("ftp://example.com")).toThrow(ValidationError);
  });

  it("should use custom field name in error message", () => {
    try {
      validateUrl("invalid", "Custom Field");
      fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as Error).message).toContain("Custom Field");
    }
  });
});

describe("validateUpdateResponse", () => {
  it("should accept valid response with no update", () => {
    const response = { updateAvailable: false };
    expect(() => validateUpdateResponse(response)).not.toThrow();
  });

  it("should accept valid response with update", () => {
    const response = {
      updateAvailable: true,
      latestVersion: "2.0.0",
      mandatory: true,
      downloadUrl: "https://example.com/app.apk",
      websiteUrl: "https://example.com",
    };
    expect(() => validateUpdateResponse(response)).not.toThrow();
  });

  it("should reject non-object responses", () => {
    expect(() => validateUpdateResponse(null)).toThrow(ValidationError);
    expect(() => validateUpdateResponse("string")).toThrow(ValidationError);
    expect(() => validateUpdateResponse(123)).toThrow(ValidationError);
  });

  it("should reject response without updateAvailable", () => {
    expect(() => validateUpdateResponse({})).toThrow(ValidationError);
  });

  it("should reject response with non-boolean updateAvailable", () => {
    expect(() => validateUpdateResponse({ updateAvailable: "true" })).toThrow(ValidationError);
  });

  it("should reject invalid downloadUrl", () => {
    const response = {
      updateAvailable: true,
      downloadUrl: "not-a-url",
    };
    expect(() => validateUpdateResponse(response)).toThrow(ValidationError);
  });

  it("should reject invalid websiteUrl", () => {
    const response = {
      updateAvailable: true,
      websiteUrl: "not-a-url",
    };
    expect(() => validateUpdateResponse(response)).toThrow(ValidationError);
  });

  it("should accept extra fields", () => {
    const response = {
      updateAvailable: false,
      customField: "custom value",
    };
    const validated = validateUpdateResponse(response);
    expect(validated).toMatchObject(response);
  });
});

describe("validateConfig", () => {
  const validConfig = {
    apiUrl: "https://example.com/check",
    version: "1.0.0",
    buildType: "production",
    projectName: "MyApp",
    packageName: "com.myapp",
  };

  it("should accept valid config", () => {
    expect(() => validateConfig(validConfig)).not.toThrow();
  });

  it("should reject missing apiUrl", () => {
    const config = { ...validConfig, apiUrl: "" };
    expect(() => validateConfig(config)).toThrow(ValidationError);
  });

  it("should reject invalid apiUrl", () => {
    const config = { ...validConfig, apiUrl: "not-a-url" };
    expect(() => validateConfig(config)).toThrow(ValidationError);
  });

  it("should reject missing version", () => {
    const config = { ...validConfig, version: "" };
    expect(() => validateConfig(config)).toThrow(ValidationError);
  });

  it("should reject missing buildType", () => {
    const config = { ...validConfig, buildType: "" };
    expect(() => validateConfig(config)).toThrow(ValidationError);
  });

  it("should reject missing projectName", () => {
    const config = { ...validConfig, projectName: "" };
    expect(() => validateConfig(config)).toThrow(ValidationError);
  });

  it("should reject missing packageName", () => {
    const config = { ...validConfig, packageName: "" };
    expect(() => validateConfig(config)).toThrow(ValidationError);
  });
});
