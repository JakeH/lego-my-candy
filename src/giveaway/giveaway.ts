import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { EOL } from 'os';
import { join as pathJoin } from 'path';
import chatBot from '../chat-bot/chat-bot';
import { CommandContext } from '../commands/commands.model';
import { getCurrentSettings } from '../settings/settings';
import { registerSpecialCommand, unregisterSpecialCommand } from '../special-commands/special';
import { logError, logWarn } from '../utils/log';
import { randomFrom, tokenStringParser, tryAwait } from '../utils/utils';

interface ItemInfo {
    name: string;
    key: string;
}

let eventHasBegun = false;
let eventStartTime: number;
let participants: Array<string> = [];
let command: string;
let periodicActiveChatHandle: NodeJS.Timeout;
let periodicInactiveChatHandle: NodeJS.Timeout;
let eventEndHandler: NodeJS.Timeout;

let itemsToGive: Array<ItemInfo> = [];

const sourceFile = pathJoin(process.cwd(), '/assets/giveaway-source.txt');
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

    itemsToGive.splice(index);

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
        logWarn(`User '${username}' could not receive a whisper. ${err.message}`);
        return;
    }

    // otherwise, they are okay to join
    participants.push(username);

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

    chatBot.say(giveaway.eventStartedChatMessage);

    periodicActiveChatHandle = setInterval(
        periodicActiveMessage,
        giveaway.periodicActiveChatIntervalInMinutes * 1e3 * 60,
    );

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

    chatBot.say(giveaway.periodicInactiveChatMessage);
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

    appendFileSync(givenFile, `${winner}\n${item.name}\n${item.key}\n`);

    writeFileSync(sourceFile, itemsToGive.map(o => {
        return `${o.name}\n${o.key}\n`;
    }).join(''));

    cleanup();
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

    // store the name locally as this is what we will need
    // to unregister, depsite what the current settings file
    // says at `stop` time.
    command = giveaway.command;

    periodicInactiveChatHandle = setTimeout(
        periodicInactiveMessage,
        giveaway.periodicInactiveChatIntervalInMinutes * 1e3 * 60,
    );

    registerSpecialCommand(command, enterUserToEvent);
}

async function stop() {
    unregisterSpecialCommand(command);

    command = null;

    cleanup();

    clearInterval(periodicInactiveChatHandle);
}

export default {
    start,
    stop,
};
