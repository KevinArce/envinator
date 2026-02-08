// tests/fixtures/comprehensive.ts

// 1. Direct Access
const apiKey = process.env.API_KEY;
const dbUrl = process.env.DATABASE_URL;

// 2. Bracket Access
const secretKey = process.env['SECRET_KEY'];
const redisHost = process.env["REDIS_HOST"];
const dynamicKey = "DYNAMIC_VAR";
const dynamicVal = process.env[dynamicKey]; // Should warn

// 3. Destructuring
const { DB_HOST, DB_PORT } = process.env;
const {
    DB_USER,
    DB_PASS: dbPassword, // Alias
    DB_NAME = 'mydb' // Default value
} = process.env;

// 4. Usage in Expressions
if (process.env.NODE_ENV === 'production') {
    console.log('Production mode');
}

const config = {
    apiKey: process.env.SERVICE_API_KEY,
    port: process.env.PORT || 3000
};

// 5. Template Strings (should count as separate if dynamic, or property if specific)
// process.env[`TEMPLATE_KEY`] - likely treated as ElementAccessExpression with TemplateExpression
const templateKey = process.env[`TEMPLATE_KEY`];

// 6. Optional Chaining (if supported by parser/runtime)
const safeAccess = process?.env?.SAFE_VAR;
const safeBracket = process?.env?.['SAFE_BRACKET'];

// 7. Nested Scopes
function setup() {
    const internalKey = process.env.INTERNAL_KEY;
    return () => {
        const nestedKey = process.env.NESTED_KEY;
    }
}

// 8. Secrets (Hardcoded)
const stripeKey = "sk_live_1234567890abcdef";
const githubToken = "ghp_abcdef1234567890";
