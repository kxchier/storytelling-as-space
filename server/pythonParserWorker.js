import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PYTHON_SCRIPT_PATH = path.join(__dirname, "parseScene.py");
const REQUEST_TIMEOUT_MS = 30_000;

export class PythonParserWorker {
  constructor() {
    this.queue = [];
    this.pending = null;
    this.buffer = "";
    this.process = null;
    this.restarting = false;
    this.start();
  }

  start() {
    this.process = spawn("python3", [PYTHON_SCRIPT_PATH, "--worker"]);
    this.buffer = "";

    this.process.stdout.on("data", (data) => {
      this.buffer += data.toString();

      let newlineIndex = this.buffer.indexOf("\n");
      while (newlineIndex !== -1) {
        const line = this.buffer.slice(0, newlineIndex);
        this.buffer = this.buffer.slice(newlineIndex + 1);
        this.handleResponseLine(line);
        newlineIndex = this.buffer.indexOf("\n");
      }
    });

    this.process.stderr.on("data", (data) => {
      console.warn("Python parser worker:", data.toString().trim());
    });

    this.process.on("error", (error) => {
      this.rejectPending(error);
      console.error("Python parser worker failed to start:", error.message);
    });

    this.process.on("close", (code) => {
      this.rejectPending(new Error(`Python parser worker exited with code ${code}`));
      this.process = null;
      if (!this.restarting) {
        this.restarting = true;
        setTimeout(() => {
          this.restarting = false;
          this.start();
        }, 250);
      }
    });
  }

  rejectPending(error) {
    if (this.pending) {
      clearTimeout(this.pending.timeoutId);
      this.pending.reject(error);
      this.pending = null;
    }
  }

  handleResponseLine(line) {
    if (!this.pending) {
      console.warn("Python parser worker returned unexpected output:", line);
      return;
    }

    clearTimeout(this.pending.timeoutId);

    try {
      const parsed = JSON.parse(line);

      if (parsed.error) {
        this.pending.reject(new Error(parsed.error));
      } else if (!Array.isArray(parsed.assets)) {
        this.pending.reject(new Error("Python parser returned invalid assets"));
      } else {
        this.pending.resolve(parsed.assets);
      }
    } catch (error) {
      this.pending.reject(error);
    }

    this.pending = null;
    this.flushQueue();
  }

  flushQueue() {
    if (this.pending || this.queue.length === 0 || !this.process) {
      return;
    }

    const request = this.queue.shift();
    this.pending = {
      resolve: request.resolve,
      reject: request.reject,
      timeoutId: setTimeout(() => {
        this.pending = null;
        request.reject(new Error("Python parser timed out"));
        this.process?.kill();
      }, REQUEST_TIMEOUT_MS),
    };

    this.process.stdin.write(
      `${JSON.stringify({ cmd: "parse", sceneText: request.sceneText })}\n`
    );
  }

  parse(sceneText) {
    return new Promise((resolve, reject) => {
      this.queue.push({ sceneText, resolve, reject });
      this.flushQueue();
    });
  }

  warmup() {
    return this.parse("A chair and a table.");
  }
}
