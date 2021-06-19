import * as ioHook from 'iohook';
import * as sendkeys from 'sendkeys';
import { processScene } from '../scenes/scenes';
import { getCurrentSettings, settingsLoaded$ } from '../settings/settings';
import { logError, logMuted, logSuccess } from '../utils/log';
import { KEYBOARD_MAPPING } from './mappings';

const reverseMapping = Object.entries(KEYBOARD_MAPPING).reduce((acc, [key, val]) => {
    acc[val] = Number(key);
    return acc;
}, {});

let keysToWatch: number[] = [];

settingsLoaded$.subscribe(settings => {
    if (!settings) {
        return;
    }
    // this is a bit of an expensive calculation, so we need to
    // prepare the list of keys to watch for as the settings change

    keysToWatch = [
        ...settings.commandTriggers,
        ...settings.pointTriggers,
        ...settings.bitTriggers,
    ]
        .filter(Boolean)
        .filter(o => o.key && !o.disabled)
        .map(o => reverseMapping[o.key]);

});

function processKey(keycode: number) {
    const {
        commandTriggers,
        bitTriggers,
        pointTriggers,
        channel,
    } = getCurrentSettings();

    const rev = KEYBOARD_MAPPING[keycode];

    const candidates = [
        ...commandTriggers,
        ...pointTriggers,
        ...bitTriggers,
    ]
        .filter(Boolean)
        .filter(o => o.key && !o.disabled)
        .filter(o => o.key === rev);

    candidates.forEach(c => {
        processScene(c.directives, {
            username: channel,
        }).catch(err => {
            logError(`Failed to run scene for keypress ${rev}`, err);
        }).finally(() => {
            logMuted(`Finished running scene for keypress ${rev}`);
        });
    });

}

function start() {
    ioHook.start();

    ioHook.on('keydown', ({ keycode }) => {
        if (!keysToWatch.includes(keycode)) {
            return;
        }

        processKey(keycode);
    });

    logSuccess('Listening for key presses');
}

function stop() {
    ioHook.stop();
}

export default {
    start,
    stop,
    send: (input: string) => sendkeys(input),
};
