import { getCurrentSettings } from '../settings/settings';
import { logError } from '../utils/log';
import { CommandContext } from '../commands/commands.model';
import { example } from './example';
import { SpecialCommandProcessor } from './special.models';

export type SpecialCommandSourceTypes = 'chat' | 'points';

const processorMap: Map<string, SpecialCommandProcessor> = new Map([
    // [createMapName('example', 'chat'), example],
]);

/**
 * Creates a name for use in the internal map, unique to its source type
 *
 * @param name
 * @param type
 * @returns
 */
function createMapKey(name: string, type: SpecialCommandSourceTypes): string {
    return `__${type}__${name}`.toLowerCase();
}

/**
 * Returns `true` if the command has an associated processor function loaded
 *
 * @param name The command text
 * @returns
 */
export function isSpecialCommand(name: string, type: SpecialCommandSourceTypes): boolean {
    return processorMap.has(createMapKey(name, type));
}

/**
 * Registers a special command at run-time
 *
 * @param name The command text
 * @param func The processor to execute for the command
 */
export function registerSpecialCommand(name: string, type: SpecialCommandSourceTypes, func: SpecialCommandProcessor) {
    processorMap.set(createMapKey(name, type), func);
}

/**
 * Unregisters a special command at run-time
 *
 * @param name The command text
 */
export function unregisterSpecialCommand(name: string, type: SpecialCommandSourceTypes) {
    processorMap.delete(createMapKey(name, type));
}

/**
 * Handles the processing of a special command
 *
 * @param name The command text
 * @param context Context of the command request
 * @returns
 */
export function processSpecialCommand(name: string, type: SpecialCommandSourceTypes, context: CommandContext): void {

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

    const func = processorMap.get(createMapKey(name, type));

    if (!func) {
        logError(`No special command processor found for '${name}'`);
    }

    try {
        func(context);
    } catch (err) {
        logError(`Failed to execute special command '${name}'`, err);
    }

}
