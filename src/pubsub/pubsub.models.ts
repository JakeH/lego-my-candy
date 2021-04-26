
export type MessageTypes = 'MESSAGE' | 'PING' | 'PONG' | 'LISTEN' | 'RESPONSE';

export interface PubSubRequest {
    type: MessageTypes;
    nonce?: string;
    data: {
        'auth_token': string;
    } & PubSubRequestBody;
}

export interface PubSubRequestBody {
    [key: string]: string | string[];
}
