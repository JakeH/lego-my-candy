import audio from '../audio/audio';
import chatbot from '../chat-bot/chat-bot';
import obs from '../obs-websocket/obs-websocket';
import { addToQueue, tokenStringParser, wait } from '../utils/utils';
import { AllSceneTypes, SceneContext } from './scenes.models';

function privateProcessScene(scenes: AllSceneTypes[], context: SceneContext): Promise<void> {

    const promises = scenes.map(async s => {

        const delay = wait((s.delayInSeconds || 0) * 1000);

        switch (s.type) {
            case 'audio':
                await delay;
                return await audio.play(s.filename);

            case 'chat':
                const message = tokenStringParser(s.message, context);
                await delay;
                return chatbot.say(message);

            case 'obs':
                const { durationInSeconds, sceneName, sourceName } = s;
                await delay;
                return await obs.pulseSource(sourceName, sceneName, durationInSeconds);

        }
    });

    return Promise.all(promises).then(() => { });

}

export async function processScene(scenes: AllSceneTypes[], context: SceneContext, before?: () => Promise<void>): Promise<void> {
    return addToQueue(() => {
        return (before || Promise.resolve)()
            .then(() => privateProcessScene(scenes, context));
    });
}
