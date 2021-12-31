import { CommandContext } from '../commands/commands.model';

export function example(context: CommandContext) {

    // in here, we can do whatever we want.

    // in `special.ts` make sure to add a member
    // with the name being the command text
    // and the value being a reference to this function

    console.log(context);
}
