import audio from '../audio/audio';
import chatbot from '../chat-bot/chat-bot';
import obs from '../obs-websocket/obs-websocket';
import { addToQueue, tokenStringParser, wait } from '../utils/utils';
import { AllSceneTypes, SceneContext } from './scenes.models';

function privateProcessScene(scenes: AllSceneTypes[], context: SceneContext): Promise<void> {

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

    return Promise.all(promises).then(() => { });

}

export async function processScene(scenes: AllSceneTypes[], context: SceneContext): Promise<void> {
    return addToQueue(() => privateProcessScene(scenes, context));
}
