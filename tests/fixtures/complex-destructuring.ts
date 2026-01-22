// Fixture: Complex destructuring patterns for testing the scanner

// Basic destructuring
const { DB_HOST, DB_PORT, DB_USER } = process.env;

// Destructuring with alias
const { DATABASE_URL: dbConnectionString, REDIS_URL: cacheUrl } = process.env;

// Nested in function
function getSecrets() {
    const { SECRET_KEY, API_TOKEN } = process.env;
    return { SECRET_KEY, API_TOKEN };
}

// Combined with direct access
const baseUrl = process.env.BASE_URL;
const { AUTH_SECRET } = process.env;

// Dynamic access (should trigger warning, not be captured)
const dynamicKey = "SOME_VAR";
const dynamicValue = process.env[dynamicKey];

export { DB_HOST, dbConnectionString };
