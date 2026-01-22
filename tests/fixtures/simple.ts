// Fixture: Simple direct access patterns for testing the scanner

// Direct property access
const apiKey = process.env.API_KEY;
const databaseUrl = process.env.DATABASE_URL;

// Bracket access with string literal
const secretKey = process.env["SECRET_KEY"];
const redisHost = process.env["REDIS_HOST"];

// Mixed usage in function
function getConfig() {
    return {
        port: process.env.PORT,
        host: process.env["HOST"],
    };
}

// Conditional usage
if (process.env.DEBUG_MODE === "true") {
    console.log("Debug mode enabled");
}

export { apiKey, databaseUrl };
