import { AllSceneTypes } from 'scenes/scenes.models';

export interface CommandDirective {
    /**
     * The command text (minus the leading !) which triggers this directive
     */
    command: string;

    /**
     * If true, only moderators can trigger this command
     */
    moderator?: boolean;

    /**
     * If true, only VIP can trigger this command
     */
    vip?: boolean;
    
    /**
     * The scene directive to invoke for this command
     */
    directives: AllSceneTypes[];
}
