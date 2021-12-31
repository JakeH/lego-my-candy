import { getCurrentSettings, settingsLoaded$ } from '../settings/settings';
import { logError } from '../utils/log';
import { CommandContext } from '../commands/commands.model';
import { example } from './example';
import { SpecialCommandProcessor } from './special.models';

const processorMap: Record<string, SpecialCommandProcessor> = {
    // 'example': example,
};

/**
 * Returns `true` if the command has an associated processor function loaded
 *
 * @param name The command text
 * @returns
 */
export function isSpecialCommand(name: string): boolean {
    return name.toLowerCase() in processorMap;
}

/**
 * Registers a special command at run-time
 *
 * @param name The command text
 * @param func The processor to execute for the command
 */
export function registerSpecialCommand(name: string, func: SpecialCommandProcessor) {
    processorMap[name.toLowerCase()] = func;
}

/**
 * Unregisters a special command at run-time
 *
 * @param name The command text
 */
export function unregisterSpecialCommand(name: string) {
    delete processorMap[name.toLowerCase()];
}

/**
 * Handles the processing of a special command
 *
 * @param name The command text
 * @param context Context of the command request
 * @returns
 */
export function processSpecialCommand(name: string, context: CommandContext): void {

    const { specialCommands } = getCurrentSettings();

    name = name.toLowerCase();

    // will only return true if this command is in the settings and it
    // is explicitly disabled. commands added at runtime will still pass
    // this check
    const isDisabled = specialCommands.some(o =>
        o.command.toLowerCase() === name && o.disabled === true
    );

    if (isDisabled) {
        return;
    }

    const func = processorMap[name];

    if (!func) {
        logError(`No special command processor found for '${name}'`);
    }

    try {
        func(context);
    } catch (err) {
        logError(`Failed to execute special command '${name}'`, err);
    }

}
