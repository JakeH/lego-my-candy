import { UserRestrictions } from '../utils/user-restrictions';
import { UserInfo } from '../chat-bot/chat-bot.models';
import { AllSceneTypes } from '../scenes/scenes.models';

export type CommandContext = UserInfo & {
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
     * Restricts this command to specific user types
     */
    restrictions?: UserRestrictions;

    /**
     * The scene directive to invoke for this command
     */
    directives: AllSceneTypes[];

    /**
     * If true, commands will be ignored if this is currently active 
     * or in the queue.
     */
    ignoreDuplicates?: boolean;

    /**
     * A delay, in seconds, between subsequent commands of the same type
     */
    delayBetweenCommands?: number;

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
