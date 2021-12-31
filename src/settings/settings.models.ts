import { UserJoinedSourceActivation } from 'arrivals/arrivals.models';
import { BitCommandDirective, CommandDirective, PointCommandDirective } from 'commands/commands.model';
import { CounterSettings } from 'counter/counter.models';
import { LegoHubSettings } from 'hub/hub.models';
import { NerfSettings } from 'nerf/nerf.model';
import { OBSWebsocketCredentials } from 'obs-websocket/obs-websocket.models';
import { SpecialCommandOptions } from 'special-commands/special.models';

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

    /**
     * Authentication details for the Twitch PubSub integration
     */
    pubsub: {

        /**
         * Twitch app client id.
         *
         * See the README.md for more information
         */
        clientId: string;

        /**
         * OAuth token for pubsub.
         *
         */
        authToken: string;

        /**
         * OAuth refresh token for pubsub.
         */
        refreshToken: string;

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

    /**
     * A list of scenes to trigger based on bit cheers
     */
    bitTriggers?: BitCommandDirective[];

    /**
     * A list of scenes to trigger based on channel point redemptions
     */
    pointTriggers?: PointCommandDirective[];

    /**
     * Counter settings
     */
    counter?: CounterSettings;

    /**
     * Commands which require custom code to execute
     */
    specialCommands?: SpecialCommandOptions;

    /**
     * Lego hub settings
     */
    legoHub?: LegoHubSettings;

    /**
     * Nerf settings
     */
    nerf?: NerfSettings;

}
