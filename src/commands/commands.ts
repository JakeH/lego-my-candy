import { CommandContext } from './commands.model';
import { getCurrentSettings } from '../settings/settings';
import { processScene } from '../scenes/scenes';
import { logError } from '../utils/log';

export function processCommand(command: string, context: CommandContext) {
    const { commandTriggers } = getCurrentSettings();

    const directive = commandTriggers.find(o => o.command.toLowerCase() === command.toLowerCase());

    // if we have no matching directive for this command, then return
    if (!directive) {
        return;
    }

    const { moderator, vip, directives } = directive;

    // if this command is meant for mods or vip...
    if ((moderator && !context.moderator)
        || (vip && (!context.vip || !context.moderator))) {
        return;
    }

    // send it to the scene processor
    processScene(directives, {
        ...context,
    }).catch(err => {
        logError(`Failed to run command ${command}`, err);
    });

}
