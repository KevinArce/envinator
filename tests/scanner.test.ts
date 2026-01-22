import { describe, it, expect } from "vitest";
import { scanCodebase, ScanResult } from "../src/scanner";
import * as path from "path";

describe("Scanner", () => {
    const fixturesDir = path.join(__dirname, "fixtures");

    describe("scanCodebase", () => {
        it("should detect direct property access (process.env.KEY)", async () => {
            const result = await scanCodebase(fixturesDir);

            expect(result.usages.has("API_KEY")).toBe(true);
            expect(result.usages.has("DATABASE_URL")).toBe(true);
            expect(result.usages.has("PORT")).toBe(true);
        });

        it("should detect bracket access (process.env['KEY'])", async () => {
            const result = await scanCodebase(fixturesDir);

            expect(result.usages.has("SECRET_KEY")).toBe(true);
            expect(result.usages.has("REDIS_HOST")).toBe(true);
            expect(result.usages.has("HOST")).toBe(true);
        });

        it("should detect destructuring (const { KEY } = process.env)", async () => {
            const result = await scanCodebase(fixturesDir);

            expect(result.usages.has("DB_HOST")).toBe(true);
            expect(result.usages.has("DB_PORT")).toBe(true);
            expect(result.usages.has("DB_USER")).toBe(true);
        });

        it("should detect destructuring with aliases", async () => {
            const result = await scanCodebase(fixturesDir);

            // The original key names should be detected, not the aliases
            expect(result.usages.has("DATABASE_URL")).toBe(true);
            expect(result.usages.has("REDIS_URL")).toBe(true);
        });

        it("should track file locations for each usage", async () => {
            const result = await scanCodebase(fixturesDir);
            const apiKeyUsages = result.usages.get("API_KEY");

            expect(apiKeyUsages).toBeDefined();
            expect(apiKeyUsages!.length).toBeGreaterThan(0);
            expect(apiKeyUsages![0].file).toContain("simple.ts");
            expect(apiKeyUsages![0].line).toBeGreaterThan(0);
        });

        it("should generate warnings for dynamic access", async () => {
            const result = await scanCodebase(fixturesDir);

            expect(result.warnings.length).toBeGreaterThan(0);
            expect(result.warnings[0]).toContain("Dynamic env access");
            expect(result.warnings[0]).toContain("dynamicKey");
        });

        it("should count files scanned", async () => {
            const result = await scanCodebase(fixturesDir);

            expect(result.filesScanned).toBe(2); // simple.ts and complex-destructuring.ts
        });

        it("should ignore NODE_ENV by default", async () => {
            const result = await scanCodebase(fixturesDir);

            expect(result.usages.has("NODE_ENV")).toBe(false);
        });
    });
});
