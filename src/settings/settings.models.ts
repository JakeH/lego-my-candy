
export interface AppSettings {

    /**
     * The channel to connect to
     */
    channel: string;

    identity: {
        /**
         * Twitch user name to use for authentication
         */
        username: string;

        /**
         * Twitch password to use for authentication. 
         * 
         * Should be the OAuth token received from Twitch. 
         * See the README.md for more information
         */
        password: string;

        /**
         * Twitch app client id.
         * 
         * See the README.md for more information
         */
        clientId: string;
    };

}
