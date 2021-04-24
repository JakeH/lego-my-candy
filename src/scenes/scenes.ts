import audio from '../audio/audio';
import chatbot from '../chat-bot/chat-bot';
import obs from '../obs-websocket/obs-websocket';
import { tokenStringParser, wait } from '../utils/utils';
import { AllSceneTypes, SceneContext } from './scenes.models';

// TODO: queueing system
const sceneQueue: {
    scenes: AllSceneTypes[];
    context: SceneContext;
    resolve: () => void;
    reject: (err: Error) => void;
}[] = [];

let isPlaying = false;

async function checkForNext() {

    if (sceneQueue.length > 0) {
        // wait for a little bit before starting the next command?
        await wait(1e3);
        const { scenes, context, resolve, reject } = sceneQueue.shift();
        isPlaying = false;
        return processScene(scenes, context).then(resolve).catch(reject);
    } else {
        isPlaying = false;
    }

}

export async function processScene(scenes: AllSceneTypes[], context: SceneContext): Promise<void> {

    if (isPlaying) {

        let resolve: () => void;
        let reject: (err: Error) => void;

        const retPromise = new Promise<void>((res, rej) => {
            resolve = res;
            reject = rej;
        });

        sceneQueue.push({
            scenes,
            context,
            resolve,
            reject,
        });
        return retPromise;
    }

    isPlaying = true;

    const promises = scenes.map(s => {

        const delay = wait((s.delayInSeconds || 0) * 1000);

        switch (s.type) {
            case 'audio':
                return delay.then(() => audio.play(s.filename));

            case 'chat':
                const message = tokenStringParser(s.message, context);
                return delay.then(() => chatbot.say(message));

            case 'obs':
                const { durationInSeconds, sceneName, sourceName } = s;
                return delay.then(() => obs.pulseSource(sourceName, sceneName, durationInSeconds));

        }
    });

    return Promise.all(promises).then(() => {
    }).finally(() => {
        checkForNext();
    });

}
