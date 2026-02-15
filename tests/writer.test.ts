import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
    appendToEnv,
    syncExampleFile,
    generateDryRunReport,
    generateTypeDefinitions,
} from "../src/writer";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

describe("Writer", () => {
    let tempDir: string;
    let originalCwd: string;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "envinator-cli-writer-"));
        originalCwd = process.cwd();
        process.chdir(tempDir);
    });

    afterEach(() => {
        process.chdir(originalCwd);
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    describe("appendToEnv", () => {
        it("should create .env file if it does not exist", () => {
            const result = appendToEnv(".env", { API_KEY: "secret" });

            expect(result.success).toBe(true);
            expect(result.keysWritten).toBe(1);
            expect(fs.existsSync(path.join(tempDir, ".env"))).toBe(true);
        });

        it("should append to existing .env file", () => {
            fs.writeFileSync(path.join(tempDir, ".env"), "EXISTING=value\n");

            const result = appendToEnv(".env", { NEW_KEY: "newvalue" });

            expect(result.success).toBe(true);
            const content = fs.readFileSync(path.join(tempDir, ".env"), "utf-8");
            expect(content).toContain("EXISTING=value");
            expect(content).toContain("NEW_KEY=newvalue");
        });

        it("should quote values with spaces", () => {
            appendToEnv(".env", { MESSAGE: "hello world" });

            const content = fs.readFileSync(path.join(tempDir, ".env"), "utf-8");
            expect(content).toContain('MESSAGE="hello world"');
        });

        it("should add date header comment", () => {
            appendToEnv(".env", { KEY: "value" });

            const content = fs.readFileSync(path.join(tempDir, ".env"), "utf-8");
            expect(content).toContain("# --- Added by Envinator");
        });

        it("should return keysWritten = 0 for empty values", () => {
            const result = appendToEnv(".env", {});

            expect(result.success).toBe(true);
            expect(result.keysWritten).toBe(0);
        });
    });

    describe("syncExampleFile", () => {
        it("should create .env.example with empty values", () => {
            const result = syncExampleFile(".env.example", ["KEY1", "KEY2"]);

            expect(result.success).toBe(true);
            const content = fs.readFileSync(
                path.join(tempDir, ".env.example"),
                "utf-8"
            );
            expect(content).toContain("KEY1=");
            expect(content).toContain("KEY2=");
        });

        it("should not duplicate existing keys", () => {
            fs.writeFileSync(
                path.join(tempDir, ".env.example"),
                "EXISTING_KEY=\n"
            );

            const result = syncExampleFile(".env.example", [
                "EXISTING_KEY",
                "NEW_KEY",
            ]);

            expect(result.keysWritten).toBe(1); // Only NEW_KEY
            const content = fs.readFileSync(
                path.join(tempDir, ".env.example"),
                "utf-8"
            );
            expect(content.match(/EXISTING_KEY/g)?.length).toBe(1);
        });
    });

    describe("generateDryRunReport", () => {
        it("should generate report with key-value pairs", () => {
            const report = generateDryRunReport({ API_KEY: "secret" });

            expect(report).toContain("Would write to .env");
            expect(report).toContain("API_KEY=");
        });

        it("should mask sensitive values", () => {
            const report = generateDryRunReport({
                API_KEY: "secret123",
                PASSWORD: "mysecret",
            });

            expect(report).toContain("API_KEY=********");
            expect(report).toContain("PASSWORD=********");
        });

        it("should return 'No changes' for empty values", () => {
            const report = generateDryRunReport({});

            expect(report).toBe("No changes would be made.");
        });
    });

    describe("generateTypeDefinitions", () => {
        it("should generate valid .d.ts content", () => {
            const filePath = "types/env.d.ts";
            const keys = ["API_KEY", "PORT"];
            const result = generateTypeDefinitions(filePath, keys);

            expect(result.success).toBe(true);
            expect(result.keysWritten).toBe(2);

            const content = fs.readFileSync(path.join(tempDir, filePath), "utf-8");
            expect(content).toContain("interface ProcessEnv {");
            expect(content).toContain("API_KEY: string;");
            expect(content).toContain("PORT: string;");
            expect(content).toContain("export {};");
        });

        it("should sort keys for deterministic output", () => {
            const filePath = "env.d.ts";
            const keys = ["Z_KEY", "A_KEY", "M_KEY"];
            generateTypeDefinitions(filePath, keys);

            const content = fs.readFileSync(path.join(tempDir, filePath), "utf-8");
            const aIndex = content.indexOf("A_KEY");
            const mIndex = content.indexOf("M_KEY");
            const zIndex = content.indexOf("Z_KEY");

            expect(aIndex).toBeLessThan(mIndex);
            expect(mIndex).toBeLessThan(zIndex);
        });

        it("should create directories if they do not exist", () => {
            const filePath = "deeply/nested/dir/env.d.ts";
            const result = generateTypeDefinitions(filePath, ["KEY"]);

            expect(result.success).toBe(true);
            expect(
                fs.existsSync(path.join(tempDir, "deeply/nested/dir/env.d.ts"))
            ).toBe(true);
        });

        it("should handle empty keys array", () => {
            const filePath = "empty.d.ts";
            const result = generateTypeDefinitions(filePath, []);

            expect(result.success).toBe(true);
            expect(result.keysWritten).toBe(0);
            const content = fs.readFileSync(path.join(tempDir, filePath), "utf-8");
            expect(content).toContain("interface ProcessEnv {");
            expect(content).toContain("}");
        });
    });
});
