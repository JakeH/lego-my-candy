import { CommandContext } from '../commands/commands.model';
import { appendFileSync, readFileSync, writeFileSync } from 'fs';
import { EOL } from 'os';
import { getCurrentSettings } from '../settings/settings';
import { registerSpecialCommand, unregisterSpecialCommand } from '../special-commands/special';
import { logWarn } from '../utils/log';
import chatBot from '../chat-bot/chat-bot';
import { tokenStringParser, tryAwait } from '../utils/utils';
import { join as pathJoin } from 'path';

interface ItemInfo {
    name: string;
    key: string;
}

let eventHasBegun = false;
let eventStartTime: number;
let participants: Array<string> = [];
let command: string;
let periodicChatHandle: NodeJS.Timeout;
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
    const random = Math.floor(Math.random() * itemsToGive.length);
    const item = itemsToGive[random];

    itemsToGive.splice(random);

    return item;
}

async function enterUserToEvent(context: CommandContext) {
    const { username } = context;
    const { giveaway } = getCurrentSettings();

    // check to see if the user is already participating
    if (participants.includes(username)) {
        return;
    }

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

    periodicChatHandle = setInterval(
        periodicMessage,
        giveaway.periodicChatIntervalInMinutes * 1e3 * 60,
    );

    eventEndHandler = setTimeout(
        eventEnded,
        giveaway.eventLengthInMinutes * 1e3 * 60,
    );
}

function periodicMessage() {
    const { giveaway } = getCurrentSettings();
    const remaining = giveaway.eventLengthInMinutes - Math.round((Date.now() - eventStartTime) / 1e3 / 60);

    if (remaining <= 0) {
        return;
    }

    const message = tokenStringParser(giveaway.periodicChatMessage, {
        count: participants.length,
        remaining,
    });

    chatBot.say(message);
}

function eventEnded() {
    const { giveaway } = getCurrentSettings();

    const random = Math.floor(Math.random() * participants.length);
    const winner = participants[random];

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

    clearInterval(periodicChatHandle);
    clearTimeout(eventEndHandler);

    participants = [];
    eventHasBegun = false;
}

async function start() {
    const { giveaway } = getCurrentSettings();

    loadSource();

    // store the name locally as this is what we will need
    // to unregister, depsite what the current settings file
    // says at `stop` time.
    command = giveaway.command;

    registerSpecialCommand(command, enterUserToEvent);
}

async function stop() {
    unregisterSpecialCommand(command);

    cleanup();
}

export default {
    start,
    stop,
};
