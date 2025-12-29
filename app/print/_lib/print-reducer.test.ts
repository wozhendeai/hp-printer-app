import {
  printReducer,
  initialState,
  PrintState,
  PrintAction,
} from "./print-reducer";

// Mock File for testing
const mockFile = new File(["test content"], "test.pdf", {
  type: "application/pdf",
});
const mockFile2 = new File(["other content"], "other.pdf", {
  type: "application/pdf",
});
const mockJobId = 12345;

describe("printReducer", () => {
  describe("initialState", () => {
    it("should be empty", () => {
      expect(initialState).toEqual({ type: "empty" });
    });
  });

  describe("SELECT_FILE", () => {
    it("should transition from empty to ready", () => {
      const state: PrintState = { type: "empty" };
      const action: PrintAction = { type: "SELECT_FILE", file: mockFile };

      const result = printReducer(state, action);

      expect(result).toEqual({ type: "ready", file: mockFile });
    });

    it("should replace file when already in ready state", () => {
      const state: PrintState = { type: "ready", file: mockFile };
      const action: PrintAction = { type: "SELECT_FILE", file: mockFile2 };

      const result = printReducer(state, action);

      expect(result).toEqual({ type: "ready", file: mockFile2 });
    });

    it("should be ignored in sending state", () => {
      const state: PrintState = {
        type: "sending",
        file: mockFile,
        jobId: mockJobId,
      };
      const action: PrintAction = { type: "SELECT_FILE", file: mockFile2 };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });

    it("should be ignored in printing state", () => {
      const state: PrintState = {
        type: "printing",
        file: mockFile,
        jobId: mockJobId,
        progress: 50,
        currentPage: 2,
        totalPages: 5,
      };
      const action: PrintAction = { type: "SELECT_FILE", file: mockFile2 };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });

    it("should be ignored in complete state", () => {
      const state: PrintState = {
        type: "complete",
        file: mockFile,
        totalPages: 5,
      };
      const action: PrintAction = { type: "SELECT_FILE", file: mockFile2 };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });

    it("should be ignored in error state", () => {
      const state: PrintState = {
        type: "error",
        file: mockFile,
        errorMessage: "Failed",
      };
      const action: PrintAction = { type: "SELECT_FILE", file: mockFile2 };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });
  });

  describe("REMOVE_FILE", () => {
    it("should transition from ready to empty", () => {
      const state: PrintState = { type: "ready", file: mockFile };
      const action: PrintAction = { type: "REMOVE_FILE" };

      const result = printReducer(state, action);

      expect(result).toEqual({ type: "empty" });
    });

    it("should be ignored in empty state", () => {
      const state: PrintState = { type: "empty" };
      const action: PrintAction = { type: "REMOVE_FILE" };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });

    it("should be ignored in sending state", () => {
      const state: PrintState = {
        type: "sending",
        file: mockFile,
        jobId: mockJobId,
      };
      const action: PrintAction = { type: "REMOVE_FILE" };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });
  });

  describe("START_SEND", () => {
    it("should transition from ready to sending with jobId", () => {
      const state: PrintState = { type: "ready", file: mockFile };
      const action: PrintAction = { type: "START_SEND", jobId: mockJobId };

      const result = printReducer(state, action);

      expect(result).toEqual({
        type: "sending",
        file: mockFile,
        jobId: mockJobId,
      });
    });

    it("should be ignored in empty state", () => {
      const state: PrintState = { type: "empty" };
      const action: PrintAction = { type: "START_SEND", jobId: mockJobId };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });

    it("should be ignored in sending state", () => {
      const state: PrintState = {
        type: "sending",
        file: mockFile,
        jobId: mockJobId,
      };
      const action: PrintAction = { type: "START_SEND", jobId: 99999 };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });

    it("should be ignored in printing state", () => {
      const state: PrintState = {
        type: "printing",
        file: mockFile,
        jobId: mockJobId,
        progress: 50,
        currentPage: 2,
        totalPages: 5,
      };
      const action: PrintAction = { type: "START_SEND", jobId: 99999 };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });
  });

  describe("START_PRINTING", () => {
    it("should transition from sending to printing", () => {
      const state: PrintState = {
        type: "sending",
        file: mockFile,
        jobId: mockJobId,
      };
      const action: PrintAction = { type: "START_PRINTING", totalPages: 10 };

      const result = printReducer(state, action);

      expect(result).toEqual({
        type: "printing",
        file: mockFile,
        jobId: mockJobId,
        progress: 0,
        currentPage: 1,
        totalPages: 10,
      });
    });

    it("should preserve jobId from sending state", () => {
      const state: PrintState = {
        type: "sending",
        file: mockFile,
        jobId: mockJobId,
      };
      const action: PrintAction = { type: "START_PRINTING", totalPages: 5 };

      const result = printReducer(state, action);

      expect(result.type === "printing" && result.jobId).toBe(mockJobId);
    });

    it("should reset progress to 0 and start at page 1", () => {
      const state: PrintState = {
        type: "sending",
        file: mockFile,
        jobId: mockJobId,
      };
      const action: PrintAction = { type: "START_PRINTING", totalPages: 5 };

      const result = printReducer(state, action);

      expect(result.type === "printing" && result.progress).toBe(0);
      expect(result.type === "printing" && result.currentPage).toBe(1);
    });

    it("should be ignored in empty state", () => {
      const state: PrintState = { type: "empty" };
      const action: PrintAction = { type: "START_PRINTING", totalPages: 5 };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });

    it("should be ignored in ready state", () => {
      const state: PrintState = { type: "ready", file: mockFile };
      const action: PrintAction = { type: "START_PRINTING", totalPages: 5 };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });

    it("should be ignored in printing state", () => {
      const state: PrintState = {
        type: "printing",
        file: mockFile,
        jobId: mockJobId,
        progress: 50,
        currentPage: 2,
        totalPages: 5,
      };
      const action: PrintAction = { type: "START_PRINTING", totalPages: 10 };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });
  });

  describe("PRINT_PROGRESS", () => {
    it("should update currentPage and progress in printing state", () => {
      const state: PrintState = {
        type: "printing",
        file: mockFile,
        jobId: mockJobId,
        progress: 0,
        currentPage: 1,
        totalPages: 5,
      };
      const action: PrintAction = {
        type: "PRINT_PROGRESS",
        currentPage: 3,
        progress: 60,
      };

      const result = printReducer(state, action);

      expect(result).toEqual({
        type: "printing",
        file: mockFile,
        jobId: mockJobId,
        progress: 60,
        currentPage: 3,
        totalPages: 5,
      });
    });

    it("should preserve file, jobId, and totalPages", () => {
      const state: PrintState = {
        type: "printing",
        file: mockFile,
        jobId: mockJobId,
        progress: 0,
        currentPage: 1,
        totalPages: 10,
      };
      const action: PrintAction = {
        type: "PRINT_PROGRESS",
        currentPage: 5,
        progress: 50,
      };

      const result = printReducer(state, action);

      expect(result.type === "printing" && result.file).toBe(mockFile);
      expect(result.type === "printing" && result.jobId).toBe(mockJobId);
      expect(result.type === "printing" && result.totalPages).toBe(10);
    });

    it("should be ignored in sending state", () => {
      const state: PrintState = {
        type: "sending",
        file: mockFile,
        jobId: mockJobId,
      };
      const action: PrintAction = {
        type: "PRINT_PROGRESS",
        currentPage: 2,
        progress: 40,
      };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });

    it("should be ignored in empty state", () => {
      const state: PrintState = { type: "empty" };
      const action: PrintAction = {
        type: "PRINT_PROGRESS",
        currentPage: 2,
        progress: 40,
      };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });
  });

  describe("COMPLETE", () => {
    it("should transition from printing to complete", () => {
      const state: PrintState = {
        type: "printing",
        file: mockFile,
        jobId: mockJobId,
        progress: 100,
        currentPage: 5,
        totalPages: 5,
      };
      const action: PrintAction = { type: "COMPLETE" };

      const result = printReducer(state, action);

      expect(result).toEqual({
        type: "complete",
        file: mockFile,
        totalPages: 5,
      });
    });

    it("should preserve file and totalPages from printing state", () => {
      const state: PrintState = {
        type: "printing",
        file: mockFile,
        jobId: mockJobId,
        progress: 100,
        currentPage: 10,
        totalPages: 10,
      };
      const action: PrintAction = { type: "COMPLETE" };

      const result = printReducer(state, action);

      expect(result.type === "complete" && result.file).toBe(mockFile);
      expect(result.type === "complete" && result.totalPages).toBe(10);
    });

    it("should be ignored in sending state", () => {
      const state: PrintState = {
        type: "sending",
        file: mockFile,
        jobId: mockJobId,
      };
      const action: PrintAction = { type: "COMPLETE" };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });

    it("should be ignored in ready state", () => {
      const state: PrintState = { type: "ready", file: mockFile };
      const action: PrintAction = { type: "COMPLETE" };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });

    it("should be ignored in complete state", () => {
      const state: PrintState = {
        type: "complete",
        file: mockFile,
        totalPages: 5,
      };
      const action: PrintAction = { type: "COMPLETE" };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });
  });

  describe("ERROR", () => {
    it("should transition from sending to error", () => {
      const state: PrintState = {
        type: "sending",
        file: mockFile,
        jobId: mockJobId,
      };
      const action: PrintAction = { type: "ERROR", message: "Connection lost" };

      const result = printReducer(state, action);

      expect(result).toEqual({
        type: "error",
        file: mockFile,
        errorMessage: "Connection lost",
      });
    });

    it("should transition from printing to error", () => {
      const state: PrintState = {
        type: "printing",
        file: mockFile,
        jobId: mockJobId,
        progress: 50,
        currentPage: 3,
        totalPages: 5,
      };
      const action: PrintAction = { type: "ERROR", message: "Paper jam" };

      const result = printReducer(state, action);

      expect(result).toEqual({
        type: "error",
        file: mockFile,
        errorMessage: "Paper jam",
      });
    });

    it("should be ignored in empty state", () => {
      const state: PrintState = { type: "empty" };
      const action: PrintAction = { type: "ERROR", message: "Error" };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });

    it("should be ignored in ready state", () => {
      const state: PrintState = { type: "ready", file: mockFile };
      const action: PrintAction = { type: "ERROR", message: "Error" };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });

    it("should be ignored in complete state", () => {
      const state: PrintState = {
        type: "complete",
        file: mockFile,
        totalPages: 5,
      };
      const action: PrintAction = { type: "ERROR", message: "Error" };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });

    it("should be ignored in error state", () => {
      const state: PrintState = {
        type: "error",
        file: mockFile,
        errorMessage: "First error",
      };
      const action: PrintAction = { type: "ERROR", message: "Second error" };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });
  });

  describe("CANCEL", () => {
    it("should transition from sending to ready", () => {
      const state: PrintState = {
        type: "sending",
        file: mockFile,
        jobId: mockJobId,
      };
      const action: PrintAction = { type: "CANCEL" };

      const result = printReducer(state, action);

      expect(result).toEqual({ type: "ready", file: mockFile });
    });

    it("should transition from printing to ready", () => {
      const state: PrintState = {
        type: "printing",
        file: mockFile,
        jobId: mockJobId,
        progress: 50,
        currentPage: 3,
        totalPages: 5,
      };
      const action: PrintAction = { type: "CANCEL" };

      const result = printReducer(state, action);

      expect(result).toEqual({ type: "ready", file: mockFile });
    });

    it("should transition from error to ready", () => {
      const state: PrintState = {
        type: "error",
        file: mockFile,
        errorMessage: "Failed",
      };
      const action: PrintAction = { type: "CANCEL" };

      const result = printReducer(state, action);

      expect(result).toEqual({ type: "ready", file: mockFile });
    });

    it("should preserve file reference", () => {
      const state: PrintState = {
        type: "sending",
        file: mockFile,
        jobId: mockJobId,
      };
      const action: PrintAction = { type: "CANCEL" };

      const result = printReducer(state, action);

      expect(result.type === "ready" && result.file).toBe(mockFile);
    });

    it("should be ignored in empty state", () => {
      const state: PrintState = { type: "empty" };
      const action: PrintAction = { type: "CANCEL" };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });

    it("should be ignored in ready state", () => {
      const state: PrintState = { type: "ready", file: mockFile };
      const action: PrintAction = { type: "CANCEL" };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });

    it("should be ignored in complete state", () => {
      const state: PrintState = {
        type: "complete",
        file: mockFile,
        totalPages: 5,
      };
      const action: PrintAction = { type: "CANCEL" };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });
  });

  describe("RESET", () => {
    it("should transition from complete to empty", () => {
      const state: PrintState = {
        type: "complete",
        file: mockFile,
        totalPages: 5,
      };
      const action: PrintAction = { type: "RESET" };

      const result = printReducer(state, action);

      expect(result).toEqual({ type: "empty" });
    });

    it("should transition from error to empty", () => {
      const state: PrintState = {
        type: "error",
        file: mockFile,
        errorMessage: "Failed",
      };
      const action: PrintAction = { type: "RESET" };

      const result = printReducer(state, action);

      expect(result).toEqual({ type: "empty" });
    });

    it("should be ignored in empty state", () => {
      const state: PrintState = { type: "empty" };
      const action: PrintAction = { type: "RESET" };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });

    it("should be ignored in ready state", () => {
      const state: PrintState = { type: "ready", file: mockFile };
      const action: PrintAction = { type: "RESET" };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });

    it("should be ignored in sending state", () => {
      const state: PrintState = {
        type: "sending",
        file: mockFile,
        jobId: mockJobId,
      };
      const action: PrintAction = { type: "RESET" };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });

    it("should be ignored in printing state", () => {
      const state: PrintState = {
        type: "printing",
        file: mockFile,
        jobId: mockJobId,
        progress: 50,
        currentPage: 2,
        totalPages: 5,
      };
      const action: PrintAction = { type: "RESET" };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });
  });

  describe("unknown action", () => {
    it("should return state unchanged for unknown action", () => {
      const state: PrintState = { type: "ready", file: mockFile };
      // @ts-expect-error - Testing unknown action type
      const action: PrintAction = { type: "UNKNOWN_ACTION" };

      const result = printReducer(state, action);

      expect(result).toBe(state);
    });
  });

  describe("state flow integration", () => {
    it("should handle full happy path: empty -> ready -> sending -> printing -> complete -> empty", () => {
      let state: PrintState = { type: "empty" };

      // Select file
      state = printReducer(state, { type: "SELECT_FILE", file: mockFile });
      expect(state.type).toBe("ready");

      // Start send (job submitted to printer, got jobId back)
      state = printReducer(state, { type: "START_SEND", jobId: mockJobId });
      expect(state.type).toBe("sending");
      expect(state.type === "sending" && state.jobId).toBe(mockJobId);

      // Start printing (job moved to processing state on printer)
      state = printReducer(state, { type: "START_PRINTING", totalPages: 3 });
      expect(state.type).toBe("printing");
      expect(state.type === "printing" && state.jobId).toBe(mockJobId);

      // Print progress
      state = printReducer(state, {
        type: "PRINT_PROGRESS",
        currentPage: 2,
        progress: 66,
      });
      expect(state.type === "printing" && state.currentPage).toBe(2);

      state = printReducer(state, {
        type: "PRINT_PROGRESS",
        currentPage: 3,
        progress: 100,
      });
      expect(state.type === "printing" && state.currentPage).toBe(3);

      // Complete
      state = printReducer(state, { type: "COMPLETE" });
      expect(state.type).toBe("complete");
      expect(state.type === "complete" && state.totalPages).toBe(3);

      // Reset
      state = printReducer(state, { type: "RESET" });
      expect(state.type).toBe("empty");
    });

    it("should handle cancel during sending", () => {
      let state: PrintState = { type: "empty" };

      state = printReducer(state, { type: "SELECT_FILE", file: mockFile });
      state = printReducer(state, { type: "START_SEND", jobId: mockJobId });

      // Cancel while still in sending state
      state = printReducer(state, { type: "CANCEL" });
      expect(state.type).toBe("ready");
      expect(state.type === "ready" && state.file).toBe(mockFile);
    });

    it("should handle error during printing with retry", () => {
      let state: PrintState = { type: "empty" };

      state = printReducer(state, { type: "SELECT_FILE", file: mockFile });
      state = printReducer(state, { type: "START_SEND", jobId: mockJobId });
      state = printReducer(state, { type: "START_PRINTING", totalPages: 5 });
      state = printReducer(state, {
        type: "PRINT_PROGRESS",
        currentPage: 2,
        progress: 40,
      });

      // Error occurs
      state = printReducer(state, { type: "ERROR", message: "Paper jam" });
      expect(state.type).toBe("error");
      expect(state.type === "error" && state.errorMessage).toBe("Paper jam");

      // Cancel (back to ready to retry)
      state = printReducer(state, { type: "CANCEL" });
      expect(state.type).toBe("ready");

      // Retry with new job
      state = printReducer(state, { type: "START_SEND", jobId: 99999 });
      expect(state.type).toBe("sending");
      expect(state.type === "sending" && state.jobId).toBe(99999);
    });
  });
});
