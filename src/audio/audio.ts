import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { logError } from '../utils/log';

const bin = './bin/ffplay';

/**
 * Plays and audio file
 * 
 * @param filename 
 * @returns 
 */
async function play(filename: string): Promise<void> {

    if (!existsSync(bin)) {
        logError('Audio player binary is missing');
        return;
    }

    const process = spawn(bin,
        [filename, '-nodisp', '-autoexit'], {
        stdio: ['ignore', 'ignore', 'ignore']
    });

    let resolve: () => void;
    let reject: (err: Error) => void;

    process.on('error', err => reject(err));
    process.on('exit', () => resolve());

    return new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });

}

export default {
    play,
};
