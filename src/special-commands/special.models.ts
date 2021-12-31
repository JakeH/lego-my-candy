import { CommandContext } from 'commands/commands.model';

/**
 * Special Command
 */
export interface SpecialCommand {
    /**
     * The command text
     */
    command: string;

    /**
     * If this command should be disabled
     */
    disabled?: boolean;
}

export type SpecialCommandProcessor = (context: CommandContext) => void;

export type SpecialCommandOptions = Array<SpecialCommand>;
