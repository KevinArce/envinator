import { Project, SyntaxKind, Node } from "ts-morph";
import * as path from "path";

// Data structures for our results
export interface EnvUsage {
    key: string;
    file: string;
    line: number;
}

export interface ScanResult {
    usages: Map<string, EnvUsage[]>;
    filesScanned: number;
    warnings: string[];
}

/**
 * Scans a directory for process.env usages using AST traversal.
 * @param rootDir The root directory to scan (e.g., "./src")
 */
export async function scanCodebase(rootDir: string): Promise<ScanResult> {
    // 1. Initialize ts-morph project
    // We skip loading the actual tsconfig.json for speed, assuming standard TS/JS setup.
    const project = new Project({
        skipAddingFilesFromTsConfig: true,
    });

    // 2. Add source files
    // We look for .ts, .js, .tsx, .jsx, avoiding node_modules and dist
    const globPattern = path.join(rootDir, "**/*.{ts,js,tsx,jsx}");
    project.addSourceFilesAtPaths([globPattern, "!**/node_modules/**", "!**/dist/**", "!**/.next/**"]);

    const sourceFiles = project.getSourceFiles();
    const resultMap = new Map<string, EnvUsage[]>();
    const warnings: string[] = [];

    // Helper to add usage to map
    const addUsage = (key: string, node: Node) => {
        // Ignore dynamic access (e.g. process.env[someVar]) which returns undefined/empty
        if (!key) return;

        // Filter out common false positives or system vars if needed
        if (["NODE_ENV"].includes(key)) return;

        const currentList = resultMap.get(key) || [];
        currentList.push({
            key,
            file: node.getSourceFile().getFilePath(),
            line: node.getStartLineNumber(),
        });
        resultMap.set(key, currentList);
    };

    // 3. Iterate over every file
    for (const file of sourceFiles) {

        // --- STRATEGY A: Direct Access (process.env.KEY) ---
        // Find all PropertyAccessExpressions (e.g. obj.prop)
        file.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression).forEach(node => {
            if (isProcessEnv(node.getExpression())) {
                addUsage(node.getName(), node);
            }
        });

        // --- STRATEGY B: Bracket Access (process.env['KEY']) ---
        // Find all ElementAccessExpressions (e.g. obj['prop'])
        file.getDescendantsOfKind(SyntaxKind.ElementAccessExpression).forEach(node => {
            if (isProcessEnv(node.getExpression())) {
                // We only care if the argument is a String Literal
                const arg = node.getArgumentExpression();
                if (Node.isStringLiteral(arg)) {
                    // remove quotes
                    addUsage(arg.getLiteralValue(), node);
                } else if (arg) {
                    // Dynamic access detected - warn user
                    const filePath = path.basename(node.getSourceFile().getFilePath());
                    const line = node.getStartLineNumber();
                    warnings.push(
                        `Dynamic env access in ${filePath}:${line} - process.env[${arg.getText()}] cannot be analyzed statically.`
                    );
                }
            }
        });

        // --- STRATEGY C: Destructuring (const { KEY } = process.env) ---
        // Find VariableDeclarations where the initializer is process.env
        file.getDescendantsOfKind(SyntaxKind.VariableDeclaration).forEach(node => {
            const initializer = node.getInitializer();
            if (initializer && isProcessEnv(initializer)) {
                // Check the name node (the left side)
                const nameNode = node.getNameNode();

                // Ensure it is an ObjectBindingPattern (destructuring) -> { A, B }
                if (Node.isObjectBindingPattern(nameNode)) {
                    nameNode.getElements().forEach(element => {
                        // Handle aliasing: const { DB_HOST: host } = process.env
                        // propertyNameNode is the left side (DB_HOST), nameNode is the alias (host)
                        // If no alias, propertyNameNode is undefined, and nameNode is the key.
                        const envKeyNode = element.getPropertyNameNode() || element.getNameNode();
                        addUsage(envKeyNode.getText(), element);
                    });
                }
            }
        });
    }

    return {
        usages: resultMap,
        filesScanned: sourceFiles.length,
        warnings
    };
}

/**
 * Helper to check if a node represents `process.env`
 */
function isProcessEnv(node: Node): boolean {
    // Simple textual check is usually sufficient and fastest for this specific case
    // Matches "process.env" exactly
    return node.getText() === "process.env";
}