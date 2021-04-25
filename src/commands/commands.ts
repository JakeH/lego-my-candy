import { CommandContext, UserRestrictions } from './commands.model';
import { getCurrentSettings } from '../settings/settings';
import { processScene } from '../scenes/scenes';
import { logError } from '../utils/log';

const allRestrictions: Array<keyof UserRestrictions> = ['broadcaster', 'moderator', 'subscriber', 'vip'];

// user hierarchy
function canUserRun(context: CommandContext, restrictions: UserRestrictions): boolean {
    const scope: Array<keyof UserRestrictions> = [];

    if (context.broadcaster) {
        scope.push('vip', 'subscriber', 'moderator', 'broadcaster');
    }
    if (context.moderator) {
        scope.push('vip', 'subscriber', 'moderator');
    }
    if (context.subscriber) {
        scope.push('subscriber');
    }
    if (context.vip) {
        scope.push('vip');
    }

    return allRestrictions.every(res => {
        return restrictions[res] !== true || scope.includes(res);
    });
}

export function processCommand(command: string, context: CommandContext) {
    const { commandTriggers } = getCurrentSettings();

    const directive = commandTriggers.find(o => o.command.toLowerCase() === command.toLowerCase());

    // if we have no matching directive for this command, then return
    if (!directive) {
        return;
    }

    // if this command is meant for mods or vip...
    if (canUserRun(context, directive)) {
        return;
    }

    // send it to the scene processor
    processScene(directive.directives, {
        ...context,
    }).catch(err => {
        logError(`Failed to run command ${command}`, err);
    });

}
