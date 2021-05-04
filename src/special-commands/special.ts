import { CommandContext } from '../commands/commands.model';
import { lurk } from './lurk';
import { SpecialCommand, SpecialCommandTypes } from './special.models';

export function processSpecialCommand(type: SpecialCommandTypes, command: SpecialCommand, context: CommandContext) {
    if (command.disabled) {
        return;
    }

    switch (type) {
        case 'lurk':
            lurk(context);
            break;

        default:
            break;

    }

}
