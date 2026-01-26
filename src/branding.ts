import { setTimeout } from "timers/promises";

// T-800 Endoskeleton Skull ASCII Art - High Detail
export const ENVINATOR_LABEL = `▓█████  ███▄    █ ██▒   █▓ ██▓ ███▄    █  ▄▄▄     ▄▄▄█████▓ ▒█████   ██▀███  
▓█   ▀  ██ ▀█   █▓██░   █▒▓██▒ ██ ▀█   █ ▒████▄   ▓  ██▒ ▓▒▒██▒  ██▒▓██ ▒ ██▒
▒███   ▓██  ▀█ ██▒▓██  █▒░▒██▒▓██  ▀█ ██▒▒██  ▀█▄ ▒ ▓██░ ▒░▒██░  ██▒▓██ ░▄█ ▒
▒▓█  ▄ ▓██▒  ▐▌██▒ ▒██ █░░░██░▓██▒  ▐▌██▒░██▄▄▄▄██░ ▓██▓ ░ ▒██   ██░▒██▀▀█▄  
░▒████▒▒██░   ▓██░  ▒▀█░  ░██░▒██░   ▓██░ ▓█   ▓██▒ ▒██▒ ░ ░ ████▓▒░░██▓ ▒██▒
░░ ▒░ ░░ ▒░   ▒ ▒   ░ ▐░  ░▓  ░ ▒░   ▒ ▒  ▒▒   ▓▒█░ ▒ ░░   ░ ▒░▒░▒░ ░ ▒▓ ░▒▓░
 ░ ░  ░░ ░░   ░ ▒░  ░ ░░   ▒ ░░ ░░   ░ ▒░  ▒   ▒▒ ░   ░      ░ ▒ ▒░   ░▒ ░ ▒░
   ░      ░   ░ ░     ░░   ▒ ░   ░   ░ ░   ░   ▒    ░      ░ ░ ░ ▒    ░░   ░ 
   ░  ░         ░      ░   ░           ░       ░  ░            ░ ░     ░     
                      ░                                                      `;

// Smoother "Cylon" Scanner Frames
// Uses block elements for a solid bar look
const SCAN_WIDTH = 40;
const EYE_SIZE = 6;

function generateScanFrames(): string[] {
    const frames: string[] = [];
    // Move Right
    for (let i = 0; i < SCAN_WIDTH - EYE_SIZE; i++) {
        const leftPad = " ".repeat(i);
        const eye = "█".repeat(EYE_SIZE);
        const rightPad = " ".repeat(SCAN_WIDTH - EYE_SIZE - i);
        frames.push(`[${leftPad}\x1b[31m${eye}\x1b[0m${rightPad}]`);
    }
    // Move Left
    for (let i = SCAN_WIDTH - EYE_SIZE; i > 0; i--) {
        const leftPad = " ".repeat(i);
        const eye = "█".repeat(EYE_SIZE);
        const rightPad = " ".repeat(SCAN_WIDTH - EYE_SIZE - i);
        frames.push(`[${leftPad}\x1b[31m${eye}\x1b[0m${rightPad}]`);
    }
    return frames;
}

const SCAN_FRAMES = generateScanFrames();

/**
 * Plays a "boot sequence" animation.
 */
export async function bootSequence() {
    console.clear();
    console.log("\x1b[36m"); // Cyan/Blue for a cleaner look, or stick to user preference. User didn't specify color, but the label is large.
    // The user's label has color codes in it? No, looking at the diff it seems to be plain text or maybe I missed it.
    // The diff showed:
    // +export const ENVINATOR_LABEL = `▓█████...
    // It doesn't look like it has embedded ansi codes in the string definition in the diff, but the user might have pasted it.
    // I will assume standard coloring for now or just print it.

    console.log(ENVINATOR_LABEL);
    console.log("\n\x1b[1m   Made with ❤️ using Antigravity\x1b[0m\n");
    await setTimeout(800);
}

/**
 * Plays a short scanning animation.
 * @param durationMs How long slightly to scan for
 */
export async function scanAnimation(durationMs: number = 3000) {
    const interval = 40; // Faster update for smoothness
    const steps = durationMs / interval;

    // Hide cursor
    process.stdout.write("\x1b[?25l");

    for (let i = 0; i < steps; i++) {
        const frame = SCAN_FRAMES[i % SCAN_FRAMES.length];
        process.stdout.write(`\rTARGET SCAN: ${frame}`);
        await setTimeout(interval);
    }

    // Show cursor and clear line
    process.stdout.write("\x1b[?25h");
    process.stdout.write("\rTARGET SCAN: [\x1b[32mTARGET LOCKED\x1b[0m]                                      \n");
}

/**
 * Enhanced "HUD" reporter helper.
 */
export function printHudBorder(text: string) {
    const len = text.length;
    console.log("\x1b[36m" + "╔" + "═".repeat(len + 2) + "╗");
    console.log("║ " + text + " ║");
    console.log("╚" + "═".repeat(len + 2) + "╝" + "\x1b[0m");
}
