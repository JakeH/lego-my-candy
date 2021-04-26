import { UserJoinedSourceActivation } from 'arrivals/arrivals.models';
import { CommandDirective } from 'commands/commands.model';
import { OBSWebsocketCredentials } from 'obs-websocket/obs-websocket.models';

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

        /**
         * Twitch app client secret
         * 
         * See the README.md for more information
         */
        clientSecret: string;
    };

    streamElements?: {

        /**
         * Stream elements token for API access
         */
        token: string;

    };

    /**
     * OBS websocket connection information
     */
    obsWebsocket: OBSWebsocketCredentials;

    /**
     * To perform actions based on users joining the stream
     */
    arrivalNotifications?: UserJoinedSourceActivation[];

    /**
     * A list of scenes to trigger based on a command
     */
    commandTriggers?: CommandDirective[];

}
