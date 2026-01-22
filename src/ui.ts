import * as path from "path";
import {
    intro,
    outro,
    text,
    confirm,
    isCancel,
    cancel,
    spinner,
    note,
} from "@clack/prompts";
import { AnalysisReport } from "./analyzer";
import { appendToEnv, syncExampleFile } from "./writer";

export interface WizardOptions {
    envPath: string;
    updateExample: boolean;
}

/**
 * Prints a summary report of the analysis (for lint/dry-run modes).
 */
export function printReport(report: AnalysisReport, filesScanned: number): void {
    console.log(`\n🔍 Scanned ${filesScanned} files.\n`);

    const total = report.all.length;
    const presentCount = report.present.length;
    const missingCount = report.missing.length;
    const emptyCount = report.empty.length;

    console.log(`📊 Summary:`);
    console.log(`   ✅ Present: ${presentCount}`);
    console.log(`   ❌ Missing: ${missingCount}`);
    console.log(`   ⚠️  Empty:   ${emptyCount}`);
    console.log(`   📦 Total:   ${total}`);

    if (report.missing.length > 0) {
        console.log(`\n❌ Missing Variables:`);
        for (const v of report.missing) {
            const location = v.usages[0]
                ? `${path.basename(v.usages[0].file)}:${v.usages[0].line}`
                : "unknown";
            console.log(`   • ${v.key} (used in ${location})`);
        }
    }

    if (report.empty.length > 0) {
        console.log(`\n⚠️  Empty Variables (defined but no value):`);
        for (const v of report.empty) {
            console.log(`   • ${v.key}`);
        }
    }
}

/**
 * The interactive wizard UI.
 * Prompts the user for missing environment variable values.
 */
export async function runWizard(
    report: AnalysisReport,
    options: WizardOptions
): Promise<void> {
    const missingCount = report.missing.length + report.empty.length;

    // 1. Introduction
    intro(`🧙 env-wizard found ${missingCount} missing variable${missingCount !== 1 ? "s" : ""}`);

    if (missingCount === 0) {
        outro(`✅ All environment variables are configured!`);
        return;
    }

    const collectedValues: Record<string, string> = {};

    // Combine missing and empty for the wizard
    const targets = [...report.missing, ...report.empty];

    // 2. Interactive Loop
    for (const target of targets) {
        const isSecret = isLikelySecret(target.key);

        // Show context - where this variable is used
        const contextLines = target.usages.slice(0, 3).map((u) => {
            return `  📍 ${path.basename(u.file)}:${u.line}`;
        });

        if (contextLines.length > 0) {
            note(contextLines.join("\n"), `Used in:`);
        }

        const value = await text({
            message: `Enter value for ${target.key}:`,
            placeholder: isSecret ? "••••••••" : "your-value-here",
            initialValue: target.currentValue || "",
            validate(val) {
                if (val.length === 0) return "Value is required!";
                return undefined;
            },
        });

        if (isCancel(value)) {
            cancel("Wizard cancelled.");
            process.exit(0);
        }

        collectedValues[target.key] = value;
    }

    // 3. Write to files
    const s = spinner();
    s.start("Writing configuration...");

    const writeResult = appendToEnv(options.envPath, collectedValues);

    if (!writeResult.success) {
        s.stop("Failed to write .env file.");
        cancel("Could not write to .env file.");
        return;
    }

    s.stop(`Updated ${options.envPath} with ${writeResult.keysWritten} variables.`);

    // 4. Optionally sync .env.example
    if (options.updateExample) {
        const shouldSync = await confirm({
            message: "Also update .env.example with these keys (empty values)?",
        });

        if (shouldSync && !isCancel(shouldSync)) {
            const exampleResult = syncExampleFile(
                ".env.example",
                Object.keys(collectedValues)
            );
            if (exampleResult.success && exampleResult.keysWritten > 0) {
                console.log(
                    `   📝 Added ${exampleResult.keysWritten} key(s) to .env.example`
                );
            }
        }
    }

    outro(`🚀 env-wizard complete!`);
}

/**
 * Heuristic to detect if a variable should be masked in the UI.
 */
function isLikelySecret(key: string): boolean {
    const sensitiveKeywords = [
        "KEY",
        "SECRET",
        "TOKEN",
        "PASSWORD",
        "AUTH",
        "CREDENTIAL",
        "PRIVATE",
    ];
    return sensitiveKeywords.some((keyword) =>
        key.toUpperCase().includes(keyword)
    );
}