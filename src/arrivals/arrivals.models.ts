
export interface UserJoinedSourceActivation {
    /**
     * The username to start the scene for
     */
    username: string;

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

    /**
     * If true, the arrival will not be played
     */
    disabled?: boolean;
}
