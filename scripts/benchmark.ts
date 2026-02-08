// scripts/benchmark.ts
import { scanCodebase } from "../src/scanner";
import * as fs from "fs";
import * as path from "path";
import { performance } from "perf_hooks";

const BENCH_DIR = path.join(__dirname, "../bench_temp");
const FILE_COUNT = 1000;

function generateFile(index: number) {
    const content = `
    const usage${index} = process.env.VAR_${index};
    if (process.env.FEATURE_FLAG_${index}) {
        console.log("Feature enabled");
    }
    const { CONFIG_${index} } = process.env;
    `;
    fs.writeFileSync(path.join(BENCH_DIR, `file_${index}.ts`), content);
}

async function runBenchmark() {
    // Setup
    console.log(`Generating ${FILE_COUNT} files...`);
    if (fs.existsSync(BENCH_DIR)) {
        fs.rmSync(BENCH_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(BENCH_DIR);

    for (let i = 0; i < FILE_COUNT; i++) {
        generateFile(i);
    }

    // Run
    console.log("Starting scan...");
    const start = performance.now();
    await scanCodebase(BENCH_DIR);
    const end = performance.now();

    const duration = end - start;
    console.log(`Scanned ${FILE_COUNT} files in ${duration.toFixed(2)}ms`);
    console.log(`Average: ${(duration / FILE_COUNT).toFixed(2)}ms per file`);

    // Cleanup
    fs.rmSync(BENCH_DIR, { recursive: true, force: true });
}

runBenchmark().catch(console.error);
