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
    password,
} from "@clack/prompts";
import { AnalysisReport } from "./analyzer";
import { appendToEnv, syncExampleFile } from "./writer";
import { bootSequence, printHudBorder, scanAnimation } from "./branding";
import { ScanResult } from "./scanner";

export interface WizardOptions {
    envPath: string;
    updateExample: boolean;
}

/**
 * Prints a summary report of the analysis (for lint/dry-run modes).
 */
export function printReport(report: AnalysisReport, scanResult: ScanResult): void {
    console.log(`\n🔍 Targets Scanned: ${scanResult.filesScanned}.\n`);

    const total = report.all.length;
    const presentCount = report.present.length;
    const missingCount = report.missing.length;
    const emptyCount = report.empty.length;
    const unusedCount = report.unused.length;

    printHudBorder(`Mission Report`);
    console.log(`   ✅ Present: ${presentCount}`);
    console.log(`   ❌ Missing: ${missingCount}`);
    console.log(`   ⚠️  Empty:   ${emptyCount}`);
    console.log(`   🧹 Unused:  ${unusedCount}`);
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

    if (report.unused.length > 0) {
        console.log(`\n🧹 Dead Code Termination (Unused Var Detection):`);
        console.log(`   "Target terminated. Variable is obsolete."`);
        for (const v of report.unused) {
            console.log(`   • ${v.key}`);
        }
    }

    if (scanResult.secrets && scanResult.secrets.length > 0) {
        console.log(`\n🚨 Security Warnings (Hardcoded Secrets Detected):`);
        for (const secret of scanResult.secrets) {
            const masked = maskSecret(secret.value);
            const location = `${path.basename(secret.file)}:${secret.line}`;
            console.log(`   • ${masked} (${secret.context}) at ${location}`);
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
    await bootSequence();
    await scanAnimation();

    intro(`🤖 Envinator Model T-800 online. Found ${missingCount} missing variable${missingCount !== 1 ? "s" : ""}.`);

    if (missingCount === 0) {
        outro(`✅ All systems operational. No missing variables.`);
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

        let value: string | symbol;

        if (isSecret) {
            value = await password({
                message: `Enter directive for ${target.key}:`,
                mask: "*",
                validate(val: string) {
                    if (val.length === 0) return "Value is required!";
                    return undefined;
                },
            });
        } else {
            value = await text({
                message: `Enter directive for ${target.key}:`,
                placeholder: "your-value-here",
                initialValue: target.currentValue || "",
                validate(val: string) {
                    if (val.length === 0) return "Value is required!";
                    return undefined;
                },
            });
        }

        if (isCancel(value)) {
            cancel("Wizard cancelled.");
            process.exit(0);
        }

        collectedValues[target.key] = value as string;
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

    outro(`Hasta la vista, undefined.`);
}

/**
 * Safely masks a secret for display.
 * Reveals a small portion of the secret to help identification,
 * but ensures it's not too much and avoids crashes for short strings.
 */
export function maskSecret(value: string): string {
    const len = value.length;
    if (len <= 4) {
        return "*".repeat(len);
    }

    // Show at most 25% of the string, capped at 3 characters
    const visibleLen = Math.min(Math.floor(len / 4), 3);

    // Ensure we show at least 1 character if the secret is longer than 4
    const finalVisible = Math.max(visibleLen, 1);

    return value.substring(0, finalVisible) + "*".repeat(len - finalVisible);
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