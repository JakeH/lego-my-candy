import chatBot from '../chat-bot/chat-bot';
import obs from '../obs-websocket/obs-websocket';
import { getCurrentSettings } from '../settings/settings';

/**
 * The list of users for whom we've already processed 
 * their arrival
 */
const knownArrivalsThisStream: string[] = [];

/**
 * Perfoms an action based on the first arrival per stream.
 * 
 * Call this method on `join` and `message`
 * 
 * @param username 
 */
export function checkFirstArrival(username: string) {
    const lowername = username.toLowerCase();

    // if we already know this user arrived, we can continue
    if (knownArrivalsThisStream.includes(lowername)) {
        return;
    }

    // query the settings in this function to allow 
    // for hot-reloads to take effect
    const { arrivalNotifications } = getCurrentSettings();

    // look for config for this user
    const userToReact = arrivalNotifications.find(o =>
        o.username.toLowerCase() === lowername
    );

    // if we have no configuration, we can leave
    if (!userToReact) {
        return;
    }

    // add the user to the known arrivals
    knownArrivalsThisStream.push(lowername);

    // send a message to the chat about their arrival
    chatBot.say(`${username} is here!`);

    // pulse the scene in OBS
    const { sourceName, sceneName, durationInSeconds } = userToReact;
    obs.pulseSource(sourceName, sceneName, durationInSeconds);
}
