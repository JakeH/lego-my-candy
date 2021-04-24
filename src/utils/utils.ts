
export async function wait(duration: number): Promise<void> {

    let resolve: () => void;

    setTimeout(() => {
        resolve();
    }, duration);

    return new Promise(res => {
        resolve = res;
    });
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
    return input.replace(TOKEN_MATCHTER_REGEX, (_, token) => {
        return values[token] || `{{${token}}}`;
    });
}
