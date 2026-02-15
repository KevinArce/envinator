import { Project, SyntaxKind, Node, PropertyAccessExpression, ElementAccessExpression, VariableDeclaration, StringLiteral } from "ts-morph";
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
    secrets: SecretLeak[];
}

export interface SecretLeak {
    value: string;
    file: string;
    line: number;
    context?: string;
}

const IGNORED_KEYS = new Set(["NODE_ENV"]);

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
    const secrets: SecretLeak[] = [];

    // Helper to add usage to map
    const addUsage = (key: string, node: Node) => {
        // Ignore dynamic access (e.g. process.env[someVar]) which returns undefined/empty
        if (!key) return;

        // Filter out common false positives or system vars if needed
        if (IGNORED_KEYS.has(key)) return;

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

        file.forEachDescendant(node => {
            switch (node.getKind()) {
                // --- STRATEGY A: Direct Access (process.env.KEY) ---
                case SyntaxKind.PropertyAccessExpression: {
                    const paNode = node as PropertyAccessExpression;
                    if (isProcessEnv(paNode.getExpression())) {
                        addUsage(paNode.getName(), paNode);
                    }
                    break;
                }

                // --- STRATEGY B: Bracket Access (process.env['KEY']) ---
                case SyntaxKind.ElementAccessExpression: {
                    const eaNode = node as ElementAccessExpression;
                    if (isProcessEnv(eaNode.getExpression())) {
                        // We only care if the argument is a String Literal
                        const arg = eaNode.getArgumentExpression();
                        if (Node.isStringLiteral(arg)) {
                            // remove quotes
                            addUsage(arg.getLiteralValue(), eaNode);
                        } else if (arg) {
                            // Dynamic access detected - warn user
                            const filePath = path.basename(eaNode.getSourceFile().getFilePath());
                            const line = eaNode.getStartLineNumber();
                            warnings.push(
                                `Dynamic env access in ${filePath}:${line} - process.env[${arg.getText()}] cannot be analyzed statically.`
                            );
                        }
                    }
                    break;
                }

                // --- STRATEGY C: Destructuring (const { KEY } = process.env) ---
                case SyntaxKind.VariableDeclaration: {
                    const vdNode = node as VariableDeclaration;
                    const initializer = vdNode.getInitializer();
                    if (initializer && isProcessEnv(initializer)) {
                        // Check the name node (the left side)
                        const nameNode = vdNode.getNameNode();

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
                    break;
                }

                // --- STRATEGY D: Secret Leak Detection ---
                case SyntaxKind.StringLiteral: {
                    const slNode = node as StringLiteral;
                    const text = slNode.getLiteralValue();
                    if (isSecret(text)) {
                        // Determine context
                        let context = "unknown usage";
                        const parent = slNode.getParent();

                        if (Node.isVariableDeclaration(parent)) {
                            context = `assigned to const/let '${parent.getName()}'`;
                        } else if (Node.isBinaryExpression(parent)) {
                            context = `assigned to '${parent.getLeft().getText()}'`;
                        } else if (Node.isCallExpression(parent)) {
                            context = `passed to function '${parent.getExpression().getText()}'`;
                        } else if (Node.isPropertyAssignment(parent)) {
                            context = `property '${parent.getName()}' in object`;
                        }

                        secrets.push({
                            value: text,
                            file: slNode.getSourceFile().getFilePath(),
                            line: slNode.getStartLineNumber(),
                            context
                        });
                    }
                    break;
                }
            }
        });
    }

    return {
        usages: resultMap,
        filesScanned: sourceFiles.length,
        warnings,
        secrets
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

const SECRET_PREFIXES = ["sk_live_", "ghp_", "xoxb-"];

/**
 * Checks if a string looks like a hardcoded secret.
 */
function isSecret(value: string): boolean {
    return SECRET_PREFIXES.some(p => value.startsWith(p));
}
