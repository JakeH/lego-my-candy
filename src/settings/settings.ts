import { AppSettings } from './settings.models';
import { watch, readFileSync, existsSync } from 'fs';
import { join as pathJoin } from 'path';

const settingsFile = pathJoin(process.cwd(), './app.settings.json');

let appSettings: AppSettings = null;

function loadSettings() {
    if (!existsSync(settingsFile)) {
        // cannot continue without settings, so we need to exit
        console.error(`${settingsFile} does not exist`);
        process.exit(1);
    }
    appSettings = JSON.parse(readFileSync(settingsFile).toString());
    delete appSettings['$schema'];
}

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
