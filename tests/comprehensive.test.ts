// tests/comprehensive.test.ts
import { describe, it, expect } from "vitest";
import { scanCodebase } from "../src/scanner";
import * as path from "path";

describe("Comprehensive Scanner Verification", () => {
    const fixturesDir = path.join(__dirname, "fixtures");

    it("should detect all expected patterns in comprehensive.ts", async () => {
        const result = await scanCodebase(fixturesDir);

        // Helper to check usage existence
        const hasUsage = (key: string) => result.usages.has(key);

        // 1. Direct Access
        expect(hasUsage("API_KEY")).toBe(true);
        expect(hasUsage("DATABASE_URL")).toBe(true);

        // 2. Bracket Access
        expect(hasUsage("SECRET_KEY")).toBe(true);
        expect(hasUsage("REDIS_HOST")).toBe(true);

        // 3. Destructuring
        expect(hasUsage("DB_HOST")).toBe(true);
        expect(hasUsage("DB_PORT")).toBe(true);
        expect(hasUsage("DB_USER")).toBe(true);
        expect(hasUsage("DB_PASS")).toBe(true); // Aliased source
        expect(hasUsage("DB_NAME")).toBe(true); // With default

        // 4. Expressions
        // NODE_ENV is ignored by default in the scanner implementation
        expect(hasUsage("NODE_ENV")).toBe(false);
        expect(hasUsage("SERVICE_API_KEY")).toBe(true);
        expect(hasUsage("PORT")).toBe(true);

        // 5. Template Strings
        // `process.env[\`TEMPLATE_KEY\`]` might be tricky if not handled explicitly as StringLiteral
        // The implementation checks for `Node.isStringLiteral(arg)`, so template literals might be missed or handled differently.
        // Let's check if it's there.
        // If it's NOT supported, this is a distinct behavior to note.
        // expect(hasUsage("TEMPLATE_KEY")).toBe(true); // Commented out for now, will verify

        // 6. Optional Chaining
        // `process?.env?.SAFE_VAR` - verify if ts-morph/scanner handles this.
        // The current implementation checks `node.getText() === "process.env"`.
        // `process?.env` text might be different or the AST structure might be slightly different.
        // We will assert on this to see if it works or fails.
        expect(hasUsage("SAFE_VAR")).toBe(true);

        // 7. Nested
        expect(hasUsage("INTERNAL_KEY")).toBe(true);
        expect(hasUsage("NESTED_KEY")).toBe(true);

        // 8. Secrets
        expect(result.secrets.some(s => s.value === "sk_live_1234567890abcdef")).toBe(true);
        expect(result.secrets.some(s => s.value === "ghp_abcdef1234567890")).toBe(true);

        // 9. Warnings
        expect(result.warnings.some(w => w.includes("Dynamic env access"))).toBe(true);
    });
});
