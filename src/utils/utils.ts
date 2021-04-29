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
        const v = values[token];
        return (v !== null && v !== undefined) ? v : sub;
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

export class PromWrap<T = void> {

    private _resolve: (value: T) => void;
    private _reject: (error: Error) => void;

    public hasBeenRejected = false;
    public hasBeenResolved = false;

    private _promise: Promise<T>;

    private readonly rejectTimeout: NodeJS.Timeout;

    constructor(autoRejectAfter?: number) {
        this._promise = new Promise<T>((res, rej) => {
            this._resolve = res;
            this._reject = rej;
        });

        if (autoRejectAfter) {
            this.rejectTimeout = setTimeout(() => { 
                this.reject(new Error('timeout'));
            }, autoRejectAfter);
        }
    }

    public resolve(value: T) {
        clearTimeout(this.rejectTimeout);
        this.hasBeenResolved = true;
        this._resolve(value);
    }

    public reject(error: Error) {
        this.hasBeenRejected = true;
        this._reject(error);
    }

    public toPromise(): Promise<T> {
        return this._promise;
    }
}

/**
 * Returns a random element from an array
 * 
 * @param arr 
 * @returns 
 */
export function randomFrom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}
