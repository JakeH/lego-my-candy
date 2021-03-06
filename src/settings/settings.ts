import { AppSettings } from './settings.models';
import { watch, readFileSync, existsSync } from 'fs';
import { join as pathJoin } from 'path';
import { logError, logMuted, logSuccess } from '../utils/log';
import { writeFileSync } from 'fs';
import { BehaviorSubject } from 'rxjs';

const settingsFile = pathJoin(process.cwd(), './app.settings.json');

let appSettings: AppSettings = null;
let skipNextReload = false;

export const settingsLoaded$ = new BehaviorSubject<AppSettings>(null);

function ensureExists() {
    if (!existsSync(settingsFile)) {
        // cannot continue without settings, so we need to exit
        logError(`Settings file does not exist`);
        logError(`Follow the instructions in the README.md and create the settings file`);
        logError(`If the file was already created, ensure it is available in the location mentioned below`);
        console.error(settingsFile);
        process.exit(0); // exit 0 to avoid the error output from node
    }
}

function loadSettings() {
    ensureExists();
    appSettings = JSON.parse(readFileSync(settingsFile).toString());
    delete appSettings['$schema'];

    settingsLoaded$.next(appSettings);

    logSuccess('Loaded settings file');
}

let debounceTimerRef: NodeJS.Timeout;

// call before watch
ensureExists();
watch(settingsFile, (event, filename) => {
    if (filename && event === 'change') {

        clearTimeout(debounceTimerRef);

        debounceTimerRef = setTimeout(() => {

            // still need this check inside of the debounce
            if (!skipNextReload) {
                logMuted(`Settings file changed, reloading`);
                loadSettings();
            }
            skipNextReload = false;

        }, 50);
    }
});

export function saveSettings(skipReload: boolean) {
    skipNextReload = skipReload;
    writeFileSync(settingsFile, JSON.stringify(appSettings, null, 4));
}

export function getCurrentSettings(): AppSettings {
    if (!appSettings) {
        loadSettings();
    }
    return appSettings;
}

export function upgradeSettings(): boolean {

    const settings = getCurrentSettings();
    let updated = false;

    if (!settings.channel) {
        settings.channel = '';
        updated = true;
    }

    if (!settings.identity) {
        settings.identity = {
            clientId: '',
            password: '',
            username: '',
        };
        updated = true;
    }

    if (!settings.obsWebsocket) {
        settings.obsWebsocket = {
            address: '',
            password: '',
        };
        updated = true;
    }

    if (!settings.pubsub) {
        settings.pubsub = {
            authToken: '',
            refreshToken: '',
            clientId: '',
        };

        updated = true;
    }

    if (!settings.arrivalNotifications) {
        settings.arrivalNotifications = [];
        updated = true;
    }

    if (!settings.bitTriggers) {
        settings.bitTriggers = [];
        updated = true;
    }

    if (!settings.pointTriggers) {
        settings.pointTriggers = [];
        updated = true;
    }

    if (!settings.streamElements) {
        settings.streamElements = {
            token: '',
        };
        updated = true;
    }

    if (!settings.counter) {
        settings.counter = {
            disabled: true,
            gameId: '',
            sourceDirectory: ''
        };

        updated = true;
    }

    if (!settings.legoHub) {
        settings.legoHub = {
            disabled: true,
        };
        updated = true;
    }

    if (!settings.nerf) {
        settings.nerf = {
            port: 'COM??',
            disabled: true,
        };

        updated = true;
    }

    if (!settings.specialCommands) {
        settings.specialCommands = [];
        updated = true;
    }

    if (!settings.giveaway) {
        settings.giveaway = {
            command: 'giveaway',
            rewardTitle: '',
            entryWhisper: 'You have been entered',
            whisperFailMessage: '@{{username}} - We are unable to send you whispers. You must enable whispers to join.',
            wonWhisper: 'You won! "{{name}}"  key: "{{key}}"',
            wonChatMessage: '{{username}} won the game "{{name}}"',
            periodicActiveChatMessage: 'Giveaway in progress! {{count}} viewer(s) have joined! {{remaining}} minute(s) left! Type !giveaway to join',
            periodicActiveChatIntervalInMinutes: 1,
            periodicInactiveChatMessage: 'Type !giveaway to join. {{count}} viewer(s) have joined, giveaway starts with {{min}} viewer(s).',
            periodicInactiveChatIntervalInMinutes: 10,
            minEntriesToStart: 1,
            eventLengthInMinutes: 5
        };
        updated = true;
    }

    if (updated) {
        // sorting just because
        const {
            channel, identity, pubsub, streamElements,
            obsWebsocket, arrivalNotifications,
            commandTriggers, bitTriggers, pointTriggers,
            counter, legoHub, nerf, specialCommands, giveaway,
        } = settings;

        appSettings = {
            channel, identity, pubsub, streamElements,
            obsWebsocket, arrivalNotifications,
            commandTriggers, bitTriggers, pointTriggers,
            counter, legoHub, nerf, specialCommands, giveaway
        };

        saveSettings(true);
    }

    return updated;

}
