import { submitPrintJob, getJobStatus, cancelJob } from "./print-api";
import type { PrintSettings } from "../_components/print-settings";

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockSettings: PrintSettings = {
  copies: 2,
  colorMode: "color",
  duplex: false,
  quality: "normal",
  paperSize: "letter",
  paperType: "plain",
};

beforeEach(() => {
  mockFetch.mockReset();
});

describe("submitPrintJob", () => {
  it("should submit file and settings via FormData", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ jobId: 123, jobUrl: "/Jobs/JobList/123" }),
    });

    const file = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });
    const result = await submitPrintJob(file, mockSettings);

    expect(result).toEqual({ jobId: 123, jobUrl: "/Jobs/JobList/123" });
    expect(mockFetch).toHaveBeenCalledWith("/api/print", {
      method: "POST",
      body: expect.any(FormData),
    });

    // Verify FormData contents
    const formData = mockFetch.mock.calls[0][1].body as FormData;
    expect(formData.get("file")).toBeInstanceOf(File);
    expect(formData.get("copies")).toBe("2");
    expect(formData.get("colorMode")).toBe("color");
    expect(formData.get("duplex")).toBe("false");
    expect(formData.get("quality")).toBe("normal");
    expect(formData.get("paperSize")).toBe("letter");
    expect(formData.get("paperType")).toBe("plain");
  });

  it("should throw on non-ok response with error message", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: "Bad Request",
      json: () => Promise.resolve({ error: "No file provided" }),
    });

    const file = new File(["test"], "test.pdf");
    await expect(submitPrintJob(file, mockSettings)).rejects.toThrow(
      "No file provided",
    );
  });

  it("should throw with statusText when no error in response body", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: "Internal Server Error",
      json: () => Promise.resolve({}),
    });

    const file = new File(["test"], "test.pdf");
    await expect(submitPrintJob(file, mockSettings)).rejects.toThrow(
      "Failed to submit job: Internal Server Error",
    );
  });

  it("should handle JSON parse failure gracefully", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: "Bad Gateway",
      json: () => Promise.reject(new Error("Invalid JSON")),
    });

    const file = new File(["test"], "test.pdf");
    await expect(submitPrintJob(file, mockSettings)).rejects.toThrow(
      "Failed to submit job: Bad Gateway",
    );
  });
});

describe("getJobStatus", () => {
  it("should fetch and return job status", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          state: "processing",
          currentPage: 2,
          totalPages: 5,
        }),
    });

    const result = await getJobStatus(123);

    expect(result).toEqual({
      state: "processing",
      currentPage: 2,
      totalPages: 5,
    });
    expect(mockFetch).toHaveBeenCalledWith("/api/print/jobs/123");
  });

  it("should return completed status", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          state: "completed",
          totalPages: 5,
        }),
    });

    const result = await getJobStatus(456);

    expect(result.state).toBe("completed");
    expect(result.totalPages).toBe(5);
  });

  it("should return aborted status with error message", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          state: "aborted",
          errorMessage: "Paper jam",
        }),
    });

    const result = await getJobStatus(789);

    expect(result.state).toBe("aborted");
    expect(result.errorMessage).toBe("Paper jam");
  });

  it("should throw on non-ok response with error message", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: "Not Found",
      json: () => Promise.resolve({ error: "Job not found" }),
    });

    await expect(getJobStatus(999)).rejects.toThrow("Job not found");
  });

  it("should throw with statusText when no error in response body", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: "Bad Gateway",
      json: () => Promise.resolve({}),
    });

    await expect(getJobStatus(123)).rejects.toThrow(
      "Failed to get job status: Bad Gateway",
    );
  });
});

describe("cancelJob", () => {
  it("should send DELETE request to cancel job", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
    });

    await cancelJob(123);

    expect(mockFetch).toHaveBeenCalledWith("/api/print/jobs/123", {
      method: "DELETE",
    });
  });

  it("should succeed with 204 No Content response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 204,
    });

    // Should not throw
    await expect(cancelJob(123)).resolves.toBeUndefined();
  });

  it("should throw on error response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () =>
        Promise.resolve({ error: "Failed to cancel job: Printer busy" }),
    });

    await expect(cancelJob(123)).rejects.toThrow(
      "Failed to cancel job: Printer busy",
    );
  });

  it("should throw with statusText when no error in response body", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      json: () => Promise.resolve({}),
    });

    await expect(cancelJob(123)).rejects.toThrow(
      "Failed to cancel job: Bad Gateway",
    );
  });
});
