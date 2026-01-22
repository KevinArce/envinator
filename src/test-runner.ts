import { scanCodebase } from "./scanner";

async function run() {
    console.log("🔍 Scanning...");
    // Pass the directory you want to scan ('.' for current)
    const result = await scanCodebase("./src");

    console.log(`✅ Scanned ${result.filesScanned} files.`);
    console.log("Found variables:");

    result.usages.forEach((usages, key) => {
        console.log(`\n📦 ${key}:`);
        usages.forEach(u => {
            console.log(`   - ${u.file}:${u.line}`);
        });
    });
}

run();