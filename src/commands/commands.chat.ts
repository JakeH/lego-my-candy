import { CommandContext } from './commands.model';
import { getCurrentSettings } from '../settings/settings';
import { processScene } from '../scenes/scenes';
import { logError, logMuted } from '../utils/log';
import { wait } from '../utils/utils';
import { userHasPermission } from '../utils/user-restrictions';

interface RecentCommand {
    command: string;
    lastRun: number;
    active: number;
}

const recentCommands: RecentCommand[] = [];

function getRecent(command: string): RecentCommand {
    const existing = recentCommands.find(o => o.command === command.toLowerCase());
    if (existing) {
        return existing;
    }

    const next = {
        command: command.toLowerCase(),
        active: 0,
        lastRun: undefined,
    };

    recentCommands.push(next);

    return next;
}

export function processCommand(command: string, context: CommandContext) {
    const { commandTriggers } = getCurrentSettings();

    if (!commandTriggers || commandTriggers.length === 0) {
        return;
    }

    const directive = commandTriggers.find(o => o.command.toLowerCase() === command.toLowerCase());

    // if we have no matching directive for this command, 
    // or it is disabled 
    if (!directive || directive.disabled) {
        return;
    }

    // if this command is meant for mods or vip...
    if (!userHasPermission(context, directive.restrictions)) {
        return;
    }
    let recent = getRecent(command);

    // if we have a cooldown...
    if (directive.cooldown) {
        // check the time since the last run
        const minElig = (recent.lastRun || 0) + (directive.cooldown * 1e3);

        if (recent.active > 0 || Date.now() < minElig) {
            logError(`Command '${command}' is on cooldown`);
            return;
        }
    }

    if (directive.ignoreDuplicates && recent.active > 0) {
        logError(`Duplicate command '${command}' ignored`);
        return;
    }

    recent.active++;

    // send it to the scene processor
    processScene(directive.directives, {
        ...context,
    }, async () => {
        recent = getRecent(command);

        if (directive.delayBetweenCommands) {
            const sinceLastRun = Date.now() - (recent.lastRun || Number.MAX_SAFE_INTEGER);
            const waitFor = Math.max(0, sinceLastRun + (directive.delayBetweenCommands * 1e3));
            logMuted(`Waiting ${waitFor} to execute '${command}'`);
            await wait(waitFor);
        }

        recent.lastRun = Date.now();

    }).catch(err => {
        logError(`Failed to run command ${command}`, err);
    }).finally(() => {
        recent = getRecent(command);
        recent.active--;

        logMuted(`Finished command '${command}'`);
    });

}
