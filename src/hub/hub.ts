import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { Subject } from 'rxjs';
import { filter, take, takeWhile } from 'rxjs/operators';
import { SequentialTaskQueue } from 'sequential-task-queue';
import { logError, logMuted, logSuccess } from '../utils/log';
import { PromWrap, wait } from '../utils/utils';

/**
 * Spawns C# console app, 
 * sends messages back and forward via stdin/out
 */

/**
 * This is the prefix given for actual commands, 
 * everything else is treated as just plain logs
 */
const INSTRUCTION_PREFIX = '3cf7f289-39b3-4faf-ba1a-cd7c4b8548d0|';

const BINARY_LOCATION = './.bin/hub/LegoMyCandy.exe';

type ExpectedMessages = 'connected' | 'exit' | 'error.no-hub' | 'started';

const messageStream$ = new Subject<ExpectedMessages>();

const messageQueue = new SequentialTaskQueue();

let ipc: ChildProcessWithoutNullStreams;

let debugMessages = false;

async function start(debug = false) {
    debugMessages = debug;

    ipc = spawn(BINARY_LOCATION);

    ipc.stderr.on('data', receiveMessage);
    ipc.stdout.on('data', receiveMessage);

    await messageQueue.cancel();

    messageQueue.push(() => {
        // sit at the front of the queue until we have a connection
        return connectBlock();
    });
}

async function connectBlock() {
    const prom = new PromWrap();

    messageStream$.pipe(
        filter(m => m === 'connected'),
        take(1),
    ).subscribe(() => {
        logSuccess('LEGO Hub connected');
        prom.resolve();
    });

    return prom.toPromise();
}

function kill() {

    ipc.kill('SIGINT');
    ipc = null;
}

async function stop() {
    if (!ipc || ipc.killed) {
        return;
    }

    await messageQueue.cancel();

    const prom = new PromWrap(15e3);

    messageStream$.pipe(
        filter(m => m === 'exit'),
        takeWhile(() => !prom.hasBeenRejected),
        take(1),
    ).subscribe(() => {
        // received exit ack, okay to kill.
        kill();

        logMuted('Safely killing Hub connection');
        prom.resolve();
    });

    sendIPC('exit', true);

    return prom.toPromise().catch(() => {
        // force kill
        logError('Force killing Hub connect');
        kill();
    });
}

function sendMotor(power: number, duration: number) {

    if (power > 100 || power < -100) {
        logError(`Invalid power of ${power} was supplied`);
        return;
    }

    messageQueue.push(async () => {
        ipc.stdin.write(`${INSTRUCTION_PREFIX}motor.A.${power}\n`);

        await wait(duration);

        ipc.stdin.write(`${INSTRUCTION_PREFIX}motor.A.0\n`);
    });

}

function sendIPC(message: string, bypassQueue = false) {

    if (debugMessages) {
        console.log(`SENT: ${message}`);
    }
    if (bypassQueue) {
        ipc.stdin.write(`${INSTRUCTION_PREFIX}${message}\n`);

    } else {
        messageQueue.push(() => {
            ipc.stdin.write(`${INSTRUCTION_PREFIX}${message}\n`);
        });
    }
}

function receiveMessage(data: any) {
    if (!data || !data.toString) {
        return;
    }
    let message: string = data.toString().trim();

    if (debugMessages) {
        console.log(`RECV: ${message}`);
    }

    if (message.startsWith(INSTRUCTION_PREFIX)) {
        message = message.substr(INSTRUCTION_PREFIX.length + 1).trim();
        messageStream$.next(message as ExpectedMessages);
    }
}

export default {
    start,
    stop,
    sendMotor,
    sendIPC,
};
