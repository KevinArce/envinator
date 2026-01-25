#!/usr/bin/env node
import { Command } from "commander";
import { scanCodebase } from "./scanner";
import { analyzeEnv } from "./analyzer";
import { runWizard, printReport } from "./ui";

const program = new Command();

program
    .name("envinator")
    .description(
        "🤖 A cybernetic organism sent back in time to terminate missing environment variables."
    )
    .version("1.0.0")
    .option("-d, --dir <path>", "Directory to scan", ".")
    .option("-e, --env <path>", "Path to .env file", ".env")
    .option("-t, --types <path>", "Output path for TypeScript definitions (e.g., ./env.d.ts)")
    .option("-x, --example", "Also update .env.example", true)
    .option("--no-example", "Skip updating .env.example")
    .option("--dry-run", "Scan and print missing vars without writing")
    .option("--lint", "Exit with error code if vars missing (CI mode)")
    .action(async (options) => {
        try {
            // Auto-enable lint mode in non-TTY environments (CI/CD)
            const isInteractive = process.stdout.isTTY ?? false;
            const lintMode = options.lint || !isInteractive;
            const dryRun = options.dryRun || false;
            const updateExample = options.example ?? true;

            // 1. Scan codebase
            const scanResult = await scanCodebase(options.dir);

            // 2. Analyze against .env
            const report = await analyzeEnv(scanResult, options.env);

            const missingCount = report.missing.length + report.empty.length;

            if (options.types) {
                const { generateTypeDefinitions } = await import("./writer");
                const allKeys = report.all.map((v) => v.key);
                const typeResult = generateTypeDefinitions(options.types, allKeys);

                if (typeResult.success) {
                    console.log(`\n📘 Generated Type Definitions: ${typeResult.path}`);
                } else {
                    console.error(`\n❌ Failed to generate type definitions at ${options.types}`);
                }
            }

            // 3. Handle based on mode
            if (lintMode) {
                // CI Mode: Just report and exit
                printReport(report, scanResult.filesScanned);

                if (scanResult.warnings && scanResult.warnings.length > 0) {
                    console.warn("\n⚠️  Warnings:");
                    scanResult.warnings.forEach((w) => console.warn(`   ${w}`));
                }

                if (missingCount > 0) {
                    console.error(
                        `\n❌ Critical Usage Error: Found ${missingCount} missing/empty environment variables.`
                    );
                    process.exit(1);
                } else {
                    console.log("\n✅ Systems Nominal. All environment variables are configured.");
                    process.exit(0);
                }
            } else if (dryRun) {
                // Dry Run: Report what would happen
                printReport(report, scanResult.filesScanned);
                console.log("\n📋 Simulation complete. No files were terminated.");
            } else {
                // Interactive Mode: Run the wizard
                await runWizard(report, {
                    envPath: options.env,
                    updateExample,
                });
            }
        } catch (error) {
            console.error("❌ Error:", error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });

program.parse();