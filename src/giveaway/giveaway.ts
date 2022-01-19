import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { EOL } from 'os';
import { join as pathJoin } from 'path';
import chatBot from '../chat-bot/chat-bot';
import { CommandContext } from '../commands/commands.model';
import { getCurrentSettings } from '../settings/settings';
import { registerSpecialCommand, SpecialCommandSourceTypes, unregisterSpecialCommand } from '../special-commands/special';
import { logError, logMuted, logWarn } from '../utils/log';
import { randomFrom, tokenStringParser, tryAwait } from '../utils/utils';

interface ItemInfo {
    name: string;
    key: string;
}

/**
 * The event is active or not
 */
let eventHasBegun = false;

/**
 * When the event became acctive
 */
let eventStartTime: number;

/**
 * The list of viewers entered into the giveaway
 */
let participants: Array<string> = [];

/**
 * The command or reward title being used to trigger the viewer's entry
 */
let command: string;

/**
 * The source type of `command`
 */
let commandType: SpecialCommandSourceTypes;

/**
 * Timer handle for the active chat message interval
 */
let periodicActiveChatHandle: NodeJS.Timeout;

/**
 * Timer handle for the inactive chat message interval
 */
let periodicInactiveChatHandle: NodeJS.Timeout;

/**
 * Timer handle for the event countdown
 */
let eventEndHandler: NodeJS.Timeout;

/**
 * Items avaialble to give away
 */
let itemsToGive: Array<ItemInfo> = [];

/**
 * Filename for the list of items to give away
 */
const sourceFile = pathJoin(process.cwd(), '/assets/giveaway-source.txt');

/**
 * Filename for the list of given items
 */
const givenFile = pathJoin(process.cwd(), '/assets/giveaway-given.txt');

function loadSource() {
    const lines = readFileSync(sourceFile).toString().split(EOL);

    // the expected format is:
    // name
    // key
    // blank line (optional)
    // name
    // key
    // blank line (optional)

    let last: string;

    itemsToGive = lines
        .map(line => line?.trim() || null)
        .filter(Boolean)
        .reduce((acc, cur) => {
            if (last) {

                acc.push({
                    name: last,
                    key: cur,
                });
                last = null;

            } else {
                last = cur;
            }

            return acc;
        }, []);

}

function getItemToGive(): ItemInfo {

    const [item, index] = randomFrom(itemsToGive);

    itemsToGive.splice(index, 1);

    return item;
}

/**
 * Adds user to event, based on their eligibility
 *
 * @param context
 * @returns
 */
async function enterUserToEvent(context: CommandContext) {
    const { username } = context;

    // check to see if the user is already participating
    if (participants.includes(username)) {
        return;
    }

    const { giveaway } = getCurrentSettings();

    const [err] = await tryAwait(() => chatBot.whisper(username, giveaway.entryWhisper));

    // if there is an error in sending them a whisper, we cannot allow them to participate
    if (err) {
        logWarn(`User '${username}' could not receive a whisper. ${err}`);
        chatBot.say(tokenStringParser(giveaway.whisperFailMessage, { username }));
        return;
    }

    // otherwise, they are okay to join
    participants.push(username);

    logMuted(`${username} has joined giveaway!`);

    // see if we can start the event yet
    startEvent();
}

/**
 * Begins the event, if the conditions for doing so are met
 *
 * @returns
 */
function startEvent() {
    const { giveaway } = getCurrentSettings();

    // check to see if we should try to start this event
    if (eventHasBegun || participants.length < giveaway.minEntriesToStart) {
        return;
    }

    // prevent us from starting multiple times
    eventHasBegun = true;
    eventStartTime = Date.now();

    // kick off the event start with the first periodic message
    periodicActiveMessage();

    // schedule the periodic message
    periodicActiveChatHandle = setInterval(
        periodicActiveMessage,
        giveaway.periodicActiveChatIntervalInMinutes * 1e3 * 60,
    );

    // handle the event completed after N minutes
    eventEndHandler = setTimeout(
        eventEnded,
        giveaway.eventLengthInMinutes * 1e3 * 60,
    );
}

/**
 * Sends the periodic reminder message while the event is active
 *
 * @returns
 */
function periodicActiveMessage() {
    const { giveaway } = getCurrentSettings();
    const remaining = giveaway.eventLengthInMinutes - Math.round((Date.now() - eventStartTime) / 1e3 / 60);

    if (remaining <= 0) {
        return;
    }

    const message = tokenStringParser(giveaway.periodicActiveChatMessage, {
        count: participants.length,
        remaining,
    });

    chatBot.say(message);
}

function periodicInactiveMessage() {
    const { giveaway } = getCurrentSettings();

    if (eventHasBegun) {
        return;
    }

    const message = tokenStringParser(giveaway.periodicInactiveChatMessage, {
        count: participants.length,
        min: giveaway.minEntriesToStart,
    });

    chatBot.say(message);
}

function eventEnded() {
    const { giveaway } = getCurrentSettings();

    const [winner] = randomFrom(participants);

    const item = getItemToGive();

    const whisper = tokenStringParser(giveaway.wonWhisper, {
        name: item.name,
        key: item.key,
    });

    const chat = tokenStringParser(giveaway.wonChatMessage, {
        name: item.name,
        username: winner,
    });

    chatBot.whisper(winner, whisper);
    chatBot.say(chat);

    appendFileSync(givenFile, `${winner}${EOL}${item.name}${EOL}${item.key}${EOL}${EOL}`);

    writeFileSync(sourceFile, itemsToGive.map(o => {
        return `${o.name}${EOL}${o.key}${EOL}${EOL}`;
    }).join(''));

    // check to see if there are any more items.
    if (!itemsToGive.length) {
        logWarn('There are no more items to give away, ending event');
        stop();
    } else {
        cleanup();
    }

}

function cleanup() {

    clearInterval(periodicActiveChatHandle);
    clearTimeout(eventEndHandler);

    participants = [];
    eventHasBegun = false;
    eventStartTime = null;
}

async function start() {

    // prevent us from starting multiple times
    if (command) {
        return;
    }

    const { giveaway } = getCurrentSettings();

    if (!existsSync(sourceFile)) {

        logError(`The giveaway source file is missing.`, {
            sourceFile,
        });

        return;
    }

    loadSource();

    if (!itemsToGive.length) {
        logError('Could not properly load the items to give.');
    }

    // store the name locally as this is what we will need
    // to unregister, depsite what the current settings file
    // says at `stop` time.
    command = giveaway.command || giveaway.rewardTitle;
    commandType = giveaway.command ? 'chat' : 'points';

    // send out the first periodic inactive message to announce
    // the event
    periodicInactiveMessage();

    periodicInactiveChatHandle = setTimeout(
        periodicInactiveMessage,
        giveaway.periodicInactiveChatIntervalInMinutes * 1e3 * 60,
    );

    registerSpecialCommand(command, commandType, enterUserToEvent);
}

async function stop() {
    // we were never started if command is falsy
    if (!command) {
        return;
    }

    unregisterSpecialCommand(command, commandType);

    command = null;

    cleanup();

    clearInterval(periodicInactiveChatHandle);
}

export default {
    start,
    stop,
};
