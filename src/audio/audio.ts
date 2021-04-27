import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { PromWrap } from '../utils/utils';
import { logError } from '../utils/log';

const bin = './.bin/ffplay.exe';

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

    const prom = new PromWrap();

    process.on('error', err => prom.reject(err));
    process.on('exit', () => prom.resolve());

    return prom.toPromise();

}

export default {
    play,
};
