
export interface CounterSettings {

    /**
     * If true, the counter functionality will be disabled.
     */
    disabled?: boolean;

    /**
     * The id / name of the game.
     */
    gameId: string;

    /**
    * The text to write to the OBS overlay text file. If empty, just the number will be written.
    */
    text?: string;

    /**
     * The directory to store the game counter information
     */
    sourceDirectory: string;

}
