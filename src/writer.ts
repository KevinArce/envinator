import * as fs from "fs";
import * as path from "path";

export interface WriteResult {
    success: boolean;
    path: string;
    keysWritten: number;
    error?: Error;
}

/**
 * Appends new environment variables to the .env file.
 * Preserves existing content and adds a header comment.
 * @param envPath Path to the .env file
 * @param values Key-value pairs to append
 */
export function appendToEnv(
    envPath: string,
    values: Record<string, string>
): WriteResult {
    const absolutePath = path.resolve(process.cwd(), envPath);
    const entries = Object.entries(values);

    if (entries.length === 0) {
        return { success: true, path: absolutePath, keysWritten: 0 };
    }

    const newLines = entries.map(([key, val]) => {
        // Quote values containing spaces or special characters
        const needsQuotes = /[\s"'`$]/.test(val);
        const safeVal = needsQuotes ? `"${val.replace(/"/g, '\\"')}"` : val;
        return `${key}=${safeVal}`;
    });

    const timestamp = new Date().toISOString().split("T")[0];
    const header = `\n# --- Added by Envinator (${timestamp}) ---\n`;
    const content = header + newLines.join("\n") + "\n";

    try {
        // Create file if it doesn't exist
        if (!fs.existsSync(absolutePath)) {
            fs.writeFileSync(absolutePath, "# Environment Variables\n");
        }
        fs.appendFileSync(absolutePath, content);
        return { success: true, path: absolutePath, keysWritten: entries.length };
    } catch (error) {
        return { success: false, path: absolutePath, keysWritten: 0, error: error as Error };
    }
}

/**
 * Updates .env.example with keys (empty values).
 * Preserves existing keys and only adds new ones.
 * @param examplePath Path to .env.example
 * @param keys Array of key names to add
 */
export function syncExampleFile(
    examplePath: string,
    keys: string[]
): WriteResult {
    const absolutePath = path.resolve(process.cwd(), examplePath);

    if (keys.length === 0) {
        return { success: true, path: absolutePath, keysWritten: 0 };
    }

    // Read existing keys to avoid duplicates
    let existingKeys = new Set<string>();
    try {
        if (fs.existsSync(absolutePath)) {
            const content = fs.readFileSync(absolutePath, "utf-8");
            const lines = content.split("\n");
            for (const line of lines) {
                const match = line.match(/^([A-Z_][A-Z0-9_]*)=/i);
                if (match) {
                    existingKeys.add(match[1]);
                }
            }
        }
    } catch {
        // File doesn't exist or can't be read, that's fine
    }

    // Filter out keys that already exist
    const newKeys = keys.filter((k) => !existingKeys.has(k));

    if (newKeys.length === 0) {
        return { success: true, path: absolutePath, keysWritten: 0 };
    }

    const header = `\n# --- Added by Envinator ---\n`;
    const content = header + newKeys.map((k) => `${k}=`).join("\n") + "\n";

    try {
        fs.appendFileSync(absolutePath, content);
        return { success: true, path: absolutePath, keysWritten: newKeys.length };
    } catch (error) {
        return { success: false, path: absolutePath, keysWritten: 0, error: error as Error };
    }
}

/**
 * Generates a TypeScript declaration file for process.env.
 * @param filePath Path to the output d.ts file
 * @param keys Array of environment variable keys
 */
export function generateTypeDefinitions(
    filePath: string,
    keys: string[]
): WriteResult {
    const absolutePath = path.resolve(process.cwd(), filePath);

    // Sort keys for deterministic output
    const sortedKeys = [...keys].sort();

    const lines = [
        "declare global {",
        "  namespace NodeJS {",
        "    interface ProcessEnv {",
        ...sortedKeys.map((k) => `      ${k}: string;`),
        "    }",
        "  }",
        "}",
        "",
        "export {};",
        "" // Trailing newline
    ];

    const content = lines.join("\n");

    try {
        // Ensure directory exists
        const dir = path.dirname(absolutePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(absolutePath, content);
        return { success: true, path: absolutePath, keysWritten: sortedKeys.length };
    } catch (error) {
        return { success: false, path: absolutePath, keysWritten: 0, error: error as Error };
    }
}
