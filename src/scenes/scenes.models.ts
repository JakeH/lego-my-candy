
export type SceneTypes = 'audio' | 'obs' | 'chat';

export interface SceneContext {
    /**
     * The user who is the focus of this scene
     */
    username: string;
}

interface SceneDirectiveBase {
    readonly type: SceneTypes;

    /**
     * A delay, in seconds before starting this scene
     */
    delayInSeconds?: number;
}

export interface SceneDirectiveAudio extends SceneDirectiveBase {
    readonly type: 'audio';

    /**
     * The name of the audio file to play
     */
    filename: string;
}

export interface SceneDirectiveOBS extends SceneDirectiveBase {
    readonly type: 'obs';

    /**
     * The source name in OBS to activate
     */
    sourceName: string;

    /**
     * The name of the scene
     */
    sceneName: string;

    /**
     * The number of seconds to keep the OBS scene activated
     */
    durationInSeconds: number;

}

export interface SceneDirectiveChat extends SceneDirectiveBase {
    readonly type: 'chat';

    /**
     * The message to send to chat.
     * 
     * This string can contain tokens for replacement. See `SceneChatContext` 
     * for the object which will be used when parsing this message.
     * 
     * @example
     * 'Hello, {{username}}!' 
     * // chat message will be 'Hello, JoMamma!'
     */
    message: string;
}

export type AllSceneTypes = SceneDirectiveChat | SceneDirectiveOBS | SceneDirectiveAudio;
