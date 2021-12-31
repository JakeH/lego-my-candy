import { CommandContext } from './commands.model';
import { getCurrentSettings } from '../settings/settings';
import { processScene } from '../scenes/scenes';
import { logError, logMuted } from '../utils/log';
import { userHasPermission } from '../utils/user-restrictions';
import { isSpecialCommand, processSpecialCommand } from '../special-commands/special';

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

    command = command.toLowerCase();

    const isSpecial = isSpecialCommand(command);

    if (isSpecial) {
        return processSpecialCommand(command, context);

    } else {
        return internalProcessCommand(command, context);
    }
}

function internalProcessCommand(command: string, context: CommandContext) {
    const { commandTriggers } = getCurrentSettings();

    if (!commandTriggers || commandTriggers.length === 0) {
        return;
    }

    // find the directive either by the root command, or its aliases
    const directive = commandTriggers
        // if this command is not disabled
        .filter(o => o.disabled !== true)
        // if this command is meant for mods or vip...
        .filter(o => userHasPermission(context, o.restrictions))
        .find(o =>
            o.command.toLowerCase() === command.toLowerCase()
            || o.aliases?.find(a => a.toLowerCase() === command.toLowerCase()),
        );

    // if we have no matching directive for this command...
    if (!directive) {
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

    recent.active++;

    // send it to the scene processor
    processScene(directive.directives, {
        ...context,
    }).catch(err => {
        logError(`Failed to run command ${command}`, err);
    }).finally(() => {
        recent = getRecent(command);
        recent.active--;
        recent.lastRun = Date.now();
        logMuted(`Finished command '${command}'`);
    });

}
