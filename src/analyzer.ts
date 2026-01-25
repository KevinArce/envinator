import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { ScanResult, EnvUsage } from "./scanner"; // Assuming scanner is in same dir

export type VarStatus = "MISSING" | "EMPTY" | "PRESENT";

export interface AnalyzedVar {
    key: string;
    status: VarStatus;
    usages: EnvUsage[]; // Context to show user where it's used
    currentValue?: string; // Undefined if missing
}

export interface AnalysisReport {
    missing: AnalyzedVar[];
    empty: AnalyzedVar[];
    present: AnalyzedVar[];
    unused: AnalyzedVar[]; // Variables in .env but not in code
    all: AnalyzedVar[];
}

/**
 * Compares the AST scan results against the local .env file.
 * @param scanResult The output from the scanner module
 * @param envPath Path to the .env file (default: ./.env)
 */
export async function analyzeEnv(scanResult: ScanResult, envPath: string = ".env"): Promise<AnalysisReport> {
    const absoluteEnvPath = path.resolve(process.cwd(), envPath);
    let envFileContent = "";
    let parsedEnv: Record<string, string> = {};

    // 1. Safe Load .env
    try {
        envFileContent = await fs.promises.readFile(absoluteEnvPath, "utf-8");
        parsedEnv = dotenv.parse(envFileContent);
    } catch (error: any) {
        if (error.code !== "ENOENT") {
            console.warn(`⚠️  Could not read ${envPath}, assuming all variables are missing.`);
        }
    }

    const report: AnalysisReport = {
        missing: [],
        empty: [],
        present: [],
        unused: [],
        all: []
    };

    // 2. Diff Logic
    // Iterate over every key found in the source code
    scanResult.usages.forEach((usages, key) => {

        let status: VarStatus = "MISSING";
        let currentValue: string | undefined = undefined;

        if (key in parsedEnv) {
            currentValue = parsedEnv[key];
            // Check if it exists but is empty (e.g. DB_HOST= )
            if (currentValue.trim() === "") {
                status = "EMPTY";
            } else {
                status = "PRESENT";
            }
        }

        const analyzedVar: AnalyzedVar = {
            key,
            status,
            usages,
            currentValue
        };

        // 3. Categorize
        report.all.push(analyzedVar);
        if (status === "MISSING") report.missing.push(analyzedVar);
        else if (status === "EMPTY") report.empty.push(analyzedVar);
        else report.present.push(analyzedVar);
    });

    // 4. Check for Unused Variables (Dead Code)
    // Keys in parsedEnv that were NOT iterated above (because they weren't in scanResult)
    for (const envKey in parsedEnv) {
        if (!scanResult.usages.has(envKey)) {
            const analyzedVar: AnalyzedVar = {
                key: envKey,
                status: "PRESENT", // It exists in .env
                usages: [], // No usages found in code
                currentValue: parsedEnv[envKey]
            };
            report.unused.push(analyzedVar);
            report.all.push(analyzedVar);
        }
    }

    return report;
}