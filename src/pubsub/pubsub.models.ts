
export interface TokenRefreshResponse {
    success: boolean;
    token: string;
    refresh: string;
    client_id: string;
}

export interface TwitchAuthToken {
    client_id: string;
    login: string;
    scopes: string[];
    user_id: string;
    expires_in: number;

    /**
     * Augemented, not part of the validate response
     */
    token: string;
}

export type MessageTypes = 'MESSAGE' | 'PING' | 'PONG' | 'LISTEN' | 'UNLISTEN' | 'RESPONSE' | 'RECONNECT';

export interface PubSubBasicRequest {
    type: MessageTypes;
}

export interface PubSubRequestBody {
    [key: string]: string | string[];
}

export interface PubSubRequest extends PubSubBasicRequest {
    nonce?: string;
    data: {
        'auth_token': string;
    } & PubSubRequestBody;
}

export interface PubSubResponse {
    readonly type: MessageTypes;
    readonly nonce?: string;
    readonly error?: string;
    readonly data?: any;
}

export interface PubSubEventMessage {
    readonly type: 'MESSAGE';
    readonly data: {
        topic: string;
        message: string;
    };
}

export type PubSubEventTypes = 'bits' | 'points' | 'sub';

export interface PubSubEventBase {
    readonly type: PubSubEventTypes;
}

export interface PubSubBitEvent extends PubSubEventBase {
    readonly type: 'bits';
    readonly data: {
        /**
         * Number of Bits used.
         */
        bits_used: number;

        /**
         * Chat message sent with the cheer.
         */
        chat_message: string;

        /**
         * All-time total number of Bits used on this channel by the specified user.
         */
        total_bits_used: number;

        /**
         * User ID of the person who used the Bits - if the cheer was not anonymous. Null if anonymous.
         */
        user_id: string | null;

        /**
         * Login name of the person who used the Bits - if the cheer was not anonymous. Null if anonymous
         */
        user_name: string | null;
    };
    readonly is_anonymous: boolean;
}

export interface PubSubPointEvent extends PubSubEventBase {
    readonly type: 'points';

    readonly data: {
        redemption: {
            user: {
                id: string;
                login: string;
                display_name: string;
            };
            reward: {
                title: string;
                prompt: string;
                cost: number;
            };
            user_input?: string;
        };
    };
}

export interface PubSubSubEvent extends PubSubEventBase {
    readonly type: 'sub';

    readonly data: {
        user_name: string;
        display_name: string;
        user_id: string;
        cumulative_months: number;
        streak_months: number;
        is_gift: boolean;

        // if a gift sub
        recipient_id?: string;
        recipient_user_name?: string;
        recipient_display_name?: string;
    };
}

export type PubSubEvents = PubSubBitEvent | PubSubPointEvent | PubSubSubEvent;
