import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { ReplaySubject, Subscription } from 'rxjs';
import { filter, take, takeWhile } from 'rxjs/operators';
import { SequentialTaskQueue } from 'sequential-task-queue';
import { logError, logMuted, logSuccess } from '../utils/log';
import { clamp, PromWrap, wait } from '../utils/utils';

/**
 * Spawns C# console app,
 * sends messages back and forward via stdin/out
 *
 * tasklist /FI "IMAGENAME eq LegoMyCandy.exe"
 */

/**
 * This is the prefix given for actual commands,
 * everything else is treated as just plain logs
 */
const INSTRUCTION_PREFIX = '3cf7f289-39b3-4faf-ba1a-cd7c4b8548d0|';

const BINARY_LOCATION = './.bin/hub/LegoMyCandy.exe';

type ExpectedMessages = 'connected' | 'exit' | 'error.no-hub' | 'started';

const messageStream$ = new ReplaySubject<ExpectedMessages>(1);

let messageStreamSub$: Subscription = Subscription.EMPTY;

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
        return connectBlock().catch(err => console.error(`connectBlock failed`, err));
    });

    // double-check
    messageStreamSub$.unsubscribe();

    messageStreamSub$ = messageStream$.subscribe(message => {
        if (message.startsWith('error')) {
            logError(`Hub: ${message}`);
        }
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
    if (!ipc) {
        return;
    }

    ipc.kill('SIGINT');
    ipc = null;
}

async function stop() {
    if (!ipc || ipc.killed) {
        return;
    }

    const prom = new PromWrap(15e3);

    messageStream$.pipe(
        filter(m => m === 'exit'),
        takeWhile(() => !prom.hasBeenRejected),
        take(1),
    ).subscribe(() => {
        // received exit ack, okay to kill.
        kill();

        logMuted('Safely killing Hub connection');
        messageStreamSub$.unsubscribe();

        ipc.stderr.removeAllListeners('data');
        ipc.stdout.removeAllListeners('data');

        prom.resolve();
    });

    // messageQueue.close(true);

    internalSend('exit').catch(err => {
        prom.reject(err);
    });

    return prom.toPromise().catch(() => {
        // force kill
        logError('Force killing Hub connect');
        kill();
    });
}

function sendMotor(power: number, duration: number, id: string) {

    power = clamp(power, -100, 100);

    messageQueue.push(async () => {
        await sendIPC(`motor.${id}.${power}`, true);

        await wait(duration);

        await sendIPC(`motor.${id}.0`, true);
    });

}

async function internalSend(message: string) {
    const prom = new PromWrap();

    ipc.stdin.write(`${INSTRUCTION_PREFIX}${message}\n`, err => {
        if (err) {
            prom.reject(err);
        } else {
            prom.resolve();
        }
    });

    return prom.toPromise();
}

async function sendIPC(message: string, bypassQueue = false) {

    if (!ipc || ipc.killed) {
        logError('Cannot send message without active child process');
        return;
    }

    if (debugMessages) {
        console.log(`SENT: ${message}`);
    }

    if (bypassQueue) {
        return internalSend(message);

    } else {
        messageQueue.push(() => internalSend(message));
    }
}

function receiveMessage(data: any) {
    if (!data || !data.toString) {
        return;
    }

    (data.toString() as string).trim().split('\n').forEach(message => {
        message = message.trim();

        if (debugMessages) {
            console.log(`RECV: ${message}`);
        }

        if (message.startsWith(INSTRUCTION_PREFIX)) {
            message = message.substr(INSTRUCTION_PREFIX.length).trim();
            messageStream$.next(message as ExpectedMessages);
        }

    });
}

export default {
    start,
    stop,
    sendMotor,
    sendIPC,
};
