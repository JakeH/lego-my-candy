import * as OBSWebsocket from 'obs-websocket-js';
import { PromWrap, tryAwait, wait } from '../utils/utils';
import { getCurrentSettings } from '../settings/settings';
import { logError, logMuted, logSuccess } from '../utils/log';

const obs = new OBSWebsocket();

async function connectToOBS() {
    const { obsWebsocket } = getCurrentSettings();

    const prom = new PromWrap();

    obs.connect(obsWebsocket).catch(err => prom.reject(err));

    obs.on('AuthenticationSuccess', () => {
        logSuccess('Connected to OBS');
        prom.resolve();
    });

    return prom.toPromise();
}

export default {

    start: async () => {
        return connectToOBS();
    },

    getSourcesList: async () => obs.send('GetSourcesList'),

    /**
     * Turns a source on, and then off after a specific period of time
     * 
     * @param source The name of the source to target
     * @param durationInSeconds The duration for this source to be on
     */
    pulseSource: async (source: string, sceneName: string, durationInSeconds: number) => {

        logMuted(`Turning '${source}' on`);

        const [onError] = await tryAwait(() =>
            obs.send('SetSceneItemRender', {
                source,
                'scene-name': sceneName,
                render: true,
            }));

        if (onError) {
            logError(`Failed to turn on scene`, { source, sceneName }, onError);
            return;
        }

        await wait(durationInSeconds * 1000);

        logMuted(`Turning '${source}' off`);

        const [offError] = await tryAwait(() =>

            obs.send('SetSceneItemRender', {
                source,
                'scene-name': sceneName,
                render: false,
            }));

        if (offError) {
            logError(`Failed to turn off scene`, { source, sceneName }, offError);
            return;
        }

    }

};
