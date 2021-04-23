import * as OBSWebsocket from 'obs-websocket-js';
import { getCurrentSettings } from '../settings/settings';

const obs = new OBSWebsocket();

async function connectToOBS() {
    const { obsWebsocket } = getCurrentSettings();
    obs.connect(obsWebsocket);
    let resolve: (x?: any) => void;
    const prom = new Promise((res) => {
        resolve = res;
    });

    obs.on('AuthenticationSuccess', () => {
        console.log('Connected to OBS');
        resolve();
    });

    return prom;
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
    pulseSource: (source: string, sceneName: string, durationInSeconds: number) => {

        console.log(`Turning '${source}' on`);

        obs.send('SetSceneItemRender', {
            source,
            render: true,
            'scene-name': sceneName,
        }).catch(err => console.error(err));

        setTimeout(() => {
            console.log(`Turning '${source}' off`);

            obs.send('SetSceneItemRender', {
                source,
                'scene-name': sceneName,
                render: false,
            }).catch(err => console.error(err));
        }, durationInSeconds * 1000);

    }

};
