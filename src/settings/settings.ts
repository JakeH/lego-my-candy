import { AppSettings } from './settings.models';
import { watch, readFileSync, existsSync } from 'fs';
import { join as pathJoin } from 'path';

const settingsFile = pathJoin(process.cwd(), './app.settings.json');

let appSettings: AppSettings = null;

function ensureExists() {
    if (!existsSync(settingsFile)) {
        // cannot continue without settings, so we need to exit
        console.error(`Settings file does not exist`);
        console.error(`Follow the instructions in the README.md and create the settings file`);
        console.error(`If the file was already created, ensure it is available in the location mentioned below`);
        console.error(settingsFile);
        process.exit(0); // exit 0 to avoid the error output from node
    }
}

function loadSettings() {
    ensureExists();
    appSettings = JSON.parse(readFileSync(settingsFile).toString());
    delete appSettings['$schema'];

    console.log('Loaded settings file');
}

// call before watch
ensureExists();
watch(settingsFile, (event, filename) => {
    if (filename && event === 'change') {
        console.log(`Settings file changed, reloading`);
        loadSettings();
    }
});

export function getCurrentSettings(): AppSettings {
    if (!appSettings) {
        loadSettings();
    }
    return appSettings;
}
