import { processScene } from '../scenes/scenes';
import { getCurrentSettings } from '../settings/settings';
import { logError, logMuted } from '../utils/log';
import { CommandContext } from './commands.model';

export function processBitCommand(amount: number, context: CommandContext) {
    const { bitTriggers } = getCurrentSettings();

    // find the directive with the highest bit amount barrier that 
    // this event matches
    const [directive] = bitTriggers.filter(o => amount >= o.minAmount)
        .sort((a, b) => b.minAmount - a.minAmount);

    // if we have no matching directive for this command, 
    // or it is disabled 
    if (!directive || directive.disabled) {
        return;
    }

    // send it to the scene processor
    processScene(directive.directives, {
        ...context,
    }).catch(err => {
        logError(`Failed to run bit command with min amount of ${directive.minAmount}`, err);
    }).finally(() => {
        logMuted(`Finished bit command with min amount of ${directive.minAmount}`);
    });
}
