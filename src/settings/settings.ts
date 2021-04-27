import { AppSettings } from './settings.models';
import { watch, readFileSync, existsSync } from 'fs';
import { join as pathJoin } from 'path';
import { logError, logMuted } from '../utils/log';
import { writeFileSync } from 'fs';

const settingsFile = pathJoin(process.cwd(), './app.settings.json');

let appSettings: AppSettings = null;
let skipNextReload = false;

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

    logMuted('Loaded settings file');
}

// call before watch
ensureExists();
watch(settingsFile, (event, filename) => {
    if (filename && event === 'change') {
        if (!skipNextReload) {
            logMuted(`Settings file changed, reloading`);
            loadSettings();
        }
        skipNextReload = false;
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
