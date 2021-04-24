import { spawn } from 'child_process';

/**
 * Plays and audio file
 * 
 * @param filename 
 * @returns 
 */
async function play(filename: string): Promise<void> {

    const process = spawn('.bin/ffplay',
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
