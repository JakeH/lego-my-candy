import { green, grey, white, yellow } from 'kleur';

/**
 * Logs an error with highlighting
 *
 * @param message
 * @param args
 */
export function logError(message: string, ...args: any[]) {
    console.error(white().bgRed(message), ...args);
}

/**
 * Logs a regular message with a muted color
 *
 * @param message
 * @param args
 */
export function logMuted(message: string, ...args: any[]) {
    console.log(grey(message), ...args);
}

export function logSuccess(message: string) {
    console.log(`✅ ${green(message)}`);
}

export function logWarn(message: string) {
    console.log(`⚠️ ${yellow(message)}`);
}
