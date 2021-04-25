import { bgBlack } from 'kleur';
import { SequentialTaskQueue } from 'sequential-task-queue';

const queue = new SequentialTaskQueue();

/**
 * Adds the function to a FIFO queue
 * 
 * @param task The function to execute
 * @returns 
 */
export async function addToQueue(task: Function) {
    return queue.push(task);
}

export async function wait(duration: number): Promise<void> {

    let resolve: () => void;

    setTimeout(() => {
        resolve();
    }, duration);

    return new Promise(res => {
        resolve = res;
    });
}

export async function tryAwait<T>(prom: () => PromiseLike<T>): Promise<[Error, T]> {
    try {
        const result = await prom();
        return [null, result];
    } catch (error) {
        return [error, null];
    }
}

const TOKEN_MATCHTER_REGEX = /{{\s?([^{}\s]*)\s?}}/g;

/**
 * Returns a string with replacements.
 * 
 * @param input The input string
 * @param values The values to use for replacements
 * 
 * @example
 * 
 * tokenStringParser('Hello, {{username}}', {username: 'jo_mamma'});
 */
export function tokenStringParser<T extends object>(input: string, values: T): string {
    return input.replace(TOKEN_MATCHTER_REGEX, (sub, token) => {
        return values[token] || sub;
    });
}

/**
 * Simple highlighter for the log
 * 
 * @param input 
 * @returns 
 */
export function lh(input: string | number) {
    return bgBlack().bold().cyan(input);
}
