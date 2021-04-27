
export type MessageTypes = 'MESSAGE' | 'PING' | 'PONG' | 'LISTEN' | 'RESPONSE';

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
}

export interface PubSubPointEvent extends PubSubEventBase {
    readonly type: 'points';
}

export interface PubSubSubEvent extends PubSubEventBase {
    readonly type: 'sub';
}

export type PubSubEvents = PubSubBitEvent | PubSubPointEvent | PubSubSubEvent;
