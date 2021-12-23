import { join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { Subscription } from 'rxjs';
import { settingsLoaded$ } from '../settings/settings';
import { tokenStringParser } from '../utils/utils';
import { logSuccess } from '../utils/log';

const COUNTER_JSON = '_counters.json';
const OVERLAY_TEXT = '_overlay.txt';

let settingsSub$ = Subscription.EMPTY;

let currentGameId: string;
let currentCount: number;
let counterText: string;

let fullCounterPath: string;
let fullOverlayPath: string;

let loadedJSON: Object;

function processCounter(change: number | string) {
    currentCount += Number(change);

    const message = tokenStringParser(counterText, {
        count: currentCount,
    });

    writeFileSync(fullOverlayPath, message, {
        encoding: 'utf-8',
        flag: 'w'
    });

    loadedJSON[currentGameId] = currentCount;
    writeFileSync(fullCounterPath, JSON.stringify(loadedJSON, null, 4), {
        encoding: 'utf-8',
        flag: 'w'
    });
}

async function start() {
    settingsSub$ = settingsLoaded$.subscribe(settings => {
        const { counter } = settings;
        if (!counter || counter.disabled) {
            currentGameId = null;
            currentCount = 0;
            return;
        }

        // settings were loaded again, probably nothing
        // to do with the counter section
        if (counter.gameId === currentGameId) {
            return;
        }

        currentGameId = counter.gameId;
        counterText = counter.text || '{{count}}';

        fullCounterPath = join(counter.sourceDirectory, COUNTER_JSON);
        fullOverlayPath = join(counter.sourceDirectory, OVERLAY_TEXT);

        if (existsSync(fullCounterPath)) {
            loadedJSON = JSON.parse(readFileSync(fullCounterPath).toString());
        } else {
            loadedJSON = {};
        }

        if (loadedJSON[currentGameId] === undefined) {
            loadedJSON[currentGameId] = 0;
        }

        currentCount = Number(loadedJSON[currentGameId]);

        processCounter(0);

        logSuccess(`Started count for '${currentGameId}' at '${currentCount}'`);
    });
}

async function stop() {
    settingsSub$.unsubscribe();
}

export default {
    start,
    stop,
    processCounter,
};
