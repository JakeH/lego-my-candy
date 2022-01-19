import { processScene } from '../scenes/scenes';
import { getCurrentSettings } from '../settings/settings';
import { isSpecialCommand, processSpecialCommand } from '../special-commands/special';
import { logError, logMuted } from '../utils/log';
import { CommandContext } from './commands.model';

export function processPointCommand(title: string, context: CommandContext) {
    // see if a special command has been registered for this reward title
    const isSpecial = isSpecialCommand(title, 'points');

    if (isSpecial) {
        return processSpecialCommand(title, 'points', context);
    }

    // if there is not a special command registered, we look at the settings file
    const { pointTriggers } = getCurrentSettings();

    if (!pointTriggers || pointTriggers.length === 0) {
        return;
    }

    // find the directive that matches the channel point title
    const directive = pointTriggers.find(o => o.rewardTitle.toLowerCase() === title.toLowerCase());

    // if we have no matching directive for this command,
    // or it is disabled
    if (!directive || directive.disabled) {
        return;
    }

    // send it to the scene processor
    processScene(directive.directives, {
        ...context,
        rewardTitle: title,
    }).catch(err => {
        logError(`Failed to run point command '${directive.rewardTitle}'`, err);
    }).finally(() => {
        logMuted(`Finished point command with min amount of '${directive.rewardTitle}'`);
    });
}
