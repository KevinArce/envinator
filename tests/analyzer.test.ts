import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { analyzeEnv, AnalysisReport } from "../src/analyzer";
import { ScanResult } from "../src/scanner";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

describe("Analyzer", () => {
    let tempDir: string;
    let envPath: string;

    beforeEach(() => {
        // Create temp directory for test files
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "envinator-cli-test-"));
        envPath = path.join(tempDir, ".env");
    });

    afterEach(() => {
        // Cleanup temp directory
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    const createMockScanResult = (keys: string[]): ScanResult => {
        const usages = new Map();
        keys.forEach((key) => {
            usages.set(key, [
                { key, file: "/test/file.ts", line: 10 },
            ]);
        });
        return { usages, filesScanned: 1, warnings: [] };
    };

    describe("analyzeEnv", () => {
        it("should categorize variables as MISSING when .env does not exist", async () => {
            const scanResult = createMockScanResult(["API_KEY", "DB_HOST"]);

            // Change to temp dir so .env doesn't exist
            const originalCwd = process.cwd();
            process.chdir(tempDir);

            try {
                const report = await analyzeEnv(scanResult, ".env");

                expect(report.missing.length).toBe(2);
                expect(report.present.length).toBe(0);
                expect(report.empty.length).toBe(0);
            } finally {
                process.chdir(originalCwd);
            }
        });

        it("should categorize variables as PRESENT when defined with value", async () => {
            // Create .env with values
            fs.writeFileSync(envPath, "API_KEY=secret123\nDB_HOST=localhost\n");

            const scanResult = createMockScanResult(["API_KEY", "DB_HOST"]);

            const originalCwd = process.cwd();
            process.chdir(tempDir);

            try {
                const report = await analyzeEnv(scanResult, ".env");

                expect(report.present.length).toBe(2);
                expect(report.missing.length).toBe(0);
                expect(report.empty.length).toBe(0);
            } finally {
                process.chdir(originalCwd);
            }
        });

        it("should categorize variables as EMPTY when defined but empty", async () => {
            // Create .env with empty values
            fs.writeFileSync(envPath, "API_KEY=\nDB_HOST=   \n");

            const scanResult = createMockScanResult(["API_KEY", "DB_HOST"]);

            const originalCwd = process.cwd();
            process.chdir(tempDir);

            try {
                const report = await analyzeEnv(scanResult, ".env");

                expect(report.empty.length).toBe(2);
                expect(report.present.length).toBe(0);
                expect(report.missing.length).toBe(0);
            } finally {
                process.chdir(originalCwd);
            }
        });

        it("should handle mixed scenarios correctly", async () => {
            // Create .env with mixed values
            fs.writeFileSync(envPath, "API_KEY=secret123\nDB_HOST=\n");

            const scanResult = createMockScanResult([
                "API_KEY",
                "DB_HOST",
                "MISSING_VAR",
            ]);

            const originalCwd = process.cwd();
            process.chdir(tempDir);

            try {
                const report = await analyzeEnv(scanResult, ".env");

                expect(report.present.length).toBe(1);
                expect(report.present[0].key).toBe("API_KEY");

                expect(report.empty.length).toBe(1);
                expect(report.empty[0].key).toBe("DB_HOST");

                expect(report.missing.length).toBe(1);
                expect(report.missing[0].key).toBe("MISSING_VAR");
            } finally {
                process.chdir(originalCwd);
            }
        });

        it("should include usage context in results", async () => {
            const scanResult = createMockScanResult(["API_KEY"]);

            const originalCwd = process.cwd();
            process.chdir(tempDir);

            try {
                const report = await analyzeEnv(scanResult, ".env");

                expect(report.missing[0].usages.length).toBe(1);
                expect(report.missing[0].usages[0].file).toBe("/test/file.ts");
                expect(report.missing[0].usages[0].line).toBe(10);
            } finally {
                process.chdir(originalCwd);
            }
        });

        it("should populate all array with all variables", async () => {
            fs.writeFileSync(envPath, "API_KEY=value\n");
            const scanResult = createMockScanResult(["API_KEY", "MISSING"]);

            const originalCwd = process.cwd();
            process.chdir(tempDir);

            try {
                const report = await analyzeEnv(scanResult, ".env");

                expect(report.all.length).toBe(2);
            } finally {
                process.chdir(originalCwd);
            }
        });
    });
});
