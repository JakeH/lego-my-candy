import chatBot from '../chat-bot/chat-bot';
import obs from '../obs-websocket/obs-websocket';
import { getCurrentSettings } from '../settings/settings';

const knownArrivalsThisStream: string[] = [];

const { arrivalNotifications } = getCurrentSettings();

/**
 * Perfoms an action based on the first arrival per stream.
 * 
 * Call this method on `join` and `message`
 * 
 * @param username 
 */
export function checkFirstArrival(username: string) {
    const lowername = username.toLowerCase();

    if (knownArrivalsThisStream.includes(lowername)) {
        return;
    }
    const userToReact = arrivalNotifications.find(o =>
        o.username.toLowerCase() === lowername
    );

    if (!userToReact) {
        return;
    }

    knownArrivalsThisStream.push(lowername);

    chatBot.say(`${username} is here!`);

    const { sourceName, sceneName, durationInSeconds } = userToReact;
    obs.pulseSource(sourceName, sceneName, durationInSeconds);
}
