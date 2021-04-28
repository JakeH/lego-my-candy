import { join } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { Subscription } from 'rxjs';
import {} from '../settings/settings';

const COUNTER_JSON = '_counters.json';
const OVERLAY_TEXT = '_overlay.txt';

const settingsSub = Subscription.EMPTY;

function start() { 
    // settingsSub = 
}

function stop() { 
    settingsSub.unsubscribe();
}

export default {
    start,
    stop,
};
