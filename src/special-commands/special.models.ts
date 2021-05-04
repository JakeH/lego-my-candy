
export interface SpecialCommand {
    command: string;
    disabled?: boolean;
}

export type SpecialCommandTypes = 'lurk' | 'other';

export type SpecialCommandOptions = {
    [key in SpecialCommandTypes]: SpecialCommand;
};
