import { UserInfo } from '../chat-bot/chat-bot.models';
import { AllSceneTypes } from '../scenes/scenes.models';

export type CommandContext = UserInfo & {
    sent: Date;
};

export type UserRestrictions = Pick<Partial<UserInfo>, 'broadcaster' | 'moderator' | 'subscriber' | 'vip'>;

export type CommandDirective = UserRestrictions & {

    /**
     * The command text (minus the leading !) which triggers this directive
     */
    command: string;

    /**
     * The scene directive to invoke for this command
     */
    directives: AllSceneTypes[];

};
