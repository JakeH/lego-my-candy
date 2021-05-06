import audio from '../audio/audio';
import chatbot from '../chat-bot/chat-bot';
import obs from '../obs-websocket/obs-websocket';
import counter from '../counter/counter';
import hub from '../hub/hub';
import { addToQueue, randomFrom, tokenStringParser, wait } from '../utils/utils';
import { AllSceneTypes, SceneContext } from './scenes.models';

function privateProcessScene(scenes: AllSceneTypes[], context: SceneContext): Promise<void> {

    const promises = scenes.map(async s => {

        const delay = wait((s.delayInSeconds || 0) * 1000);

        switch (s.type) {
            case 'audio': {
                let singleFilename: string;
                if (Array.isArray(s.filename)) {
                    // if multiple are provided, choose one at random
                    singleFilename = randomFrom(s.filename);
                } else {
                    singleFilename = s.filename;
                }

                return delay.then(() => audio.play(singleFilename));
            }

            case 'chat': {
                const message = tokenStringParser(s.message, context);
                return delay.then(() => chatbot.say(message));
            }

            case 'obs': {
                const { durationInSeconds, sceneName, sourceName } = s;
                return delay.then(() => obs.pulseSource(sourceName, sceneName, durationInSeconds));
            }

            case 'counter': {
                const { change } = s;
                return delay.then(() => counter.processCounter(change));
            }

            case 'motor': {
                const { durationInSeconds, power } = s;
                return delay.then(() => hub.sendMotor(power, durationInSeconds * 1e3));
            }

        }
    });

    return Promise.all(promises).then(() => { });

}

export async function processScene(scenes: AllSceneTypes[], context: SceneContext): Promise<void> {
    return addToQueue(() => {
        return privateProcessScene(scenes, context);
    });
}
