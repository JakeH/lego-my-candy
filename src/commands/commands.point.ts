import { processScene } from '../scenes/scenes';
import { getCurrentSettings } from '../settings/settings';
import { logError, logMuted } from '../utils/log';
import { CommandContext } from './commands.model';

export function processPointCommand(title: string, context: CommandContext) {
    const { pointTriggers } = getCurrentSettings();

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
    }).catch(err => {
        logError(`Failed to run point command '${directive.rewardTitle}'`, err);
    }).finally(() => {
        logMuted(`Finished point command with min amount of '${directive.rewardTitle}'`);
    });
}
