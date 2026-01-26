
export const apiKey = "sk_live_1234567890abcdef";
export const githubToken = "ghp_abcdef1234567890";
export const slackToken = "xoxb-1234-5678-abcdef";
const safeString = "just a normal string";

function connect(token: string) {
    console.log(token);
}

connect("sk_live_embedded_in_function_call");
