import { UserRestrictions } from '../utils/user-restrictions';
import { UserInfo } from '../chat-bot/chat-bot.models';
import { AllSceneTypes } from '../scenes/scenes.models';

export type CommandContext = UserInfo & {
    message: string;
    command: string;
    sent: Date;
};

export interface KeyActivatedDirective {
    key?: string;
}

export interface CommandDirective extends KeyActivatedDirective {

    /**
     * The command text (minus the leading !) which triggers this directive
     */
    command: string;

    /**
     * Other commands this can be triggered by.
     */
    aliases?: string[];

    /**
     * Restricts this command to specific user types
     */
    restrictions?: UserRestrictions;

    /**
     * If provided, only the following users can use this command. Not case-sensitive
     *
     * Overrides any check in `restrictions`
     */
    users?: string[];

    /**
     * The scene directive to invoke for this command
     */
    directives: AllSceneTypes[];

    /**
     * A command cooldown. Will be immediately rejected if another instance
     * of this command is in the queue, or if it was executed before
     * this amount of seconds have elapsed since the last run.
     */
    cooldown?: number;

    /**
     * If true, the command will be disabled
     */
    disabled?: boolean;

}

export interface BitCommandDirective extends KeyActivatedDirective {

    /**
     * The minimum amount of bits needed to activate this command
     */
    minAmount: number;

    /**
    * The scene directive to invoke for this command
    */
    directives: AllSceneTypes[];

    /**
     * If true, the command will be disabled
     */
    disabled?: boolean;
}

export interface PointCommandDirective extends KeyActivatedDirective {

    /**
     * The reward title which, when redeemed, will activate this command
     */
    rewardTitle: string;

    /**
    * The scene directive to invoke for this command
    */
    directives: AllSceneTypes[];

    /**
     * If true, the command will be disabled
     */
    disabled?: boolean;

}
