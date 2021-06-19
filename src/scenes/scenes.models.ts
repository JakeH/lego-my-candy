export type SceneTypes = 'audio' | 'obs' | 'chat' | 'counter' | 'motor' | 'nerf' | 'key';

export interface SceneContext {
    /**
     * The user who is the focus of this scene
     */
    username: string;

    /**
     * Other arbitrary information
     */
    [key: string]: any;
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
     * The name of the audio file to play.
     *
     * If multiple files are provided, one will be played at random
     */
    filename: string | string[];
}

export interface SceneDirectiveOBS extends SceneDirectiveBase {
    readonly type: 'obs';

    /**
     * The source name in OBS to activate
     *
     * If multiple sources are provided, one will be used at random
     */
    sourceName: string | string[];

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

export interface SceneDirectiveCount extends SceneDirectiveBase {
    readonly type: 'counter';

    /**
     * The amount to change the counter. `1` to increment by 1, `-100` to decrement by 100;
     */
    change: number;
}

export interface SceneDirectiveMotor extends SceneDirectiveBase {
    readonly type: 'motor';

    /**
     * The power to apply to the motor. Must be between -100 and 100
     */
    power: number;

    /**
     * The duration, in seconds, to apply power to the motor
     */
    durationInSeconds: number;

    /**
     * A, B, C, or D
     */
    id: string;
}

export interface SceneDirectiveNerf extends SceneDirectiveBase {
    readonly type: 'nerf';

    // for now we don't have additional options, just a single fire
}

export interface SceneDirectiveKey extends SceneDirectiveBase {
    readonly type: 'key';

    /**
     * The keys to send. For special keys, wrap in brackets.
     *
     * Hello!{ENTER}
     *
     * {F7}{HOME}
     */
    keys: string;
}

export type AllSceneTypes =
    | SceneDirectiveChat
    | SceneDirectiveOBS
    | SceneDirectiveAudio
    | SceneDirectiveCount
    | SceneDirectiveMotor
    | SceneDirectiveKey
    | SceneDirectiveNerf;
