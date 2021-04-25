import { ChatUserstate, CommonUserstate } from 'tmi.js';

export type EventType = 'message' | 'command' | 'redeem' | 'cheer' | 'join' | 'leave' | 'raided';

interface EventBase {
    readonly type: EventType;
    readonly username: string;
    readonly sent: Date;
}

export interface UserInfo {
    readonly username: string;
    readonly moderator: boolean;
    readonly vip: boolean;
    readonly broadcaster: boolean;
    readonly subscriber: boolean;
    readonly founder: boolean;
}

interface EventBaseWithContext<T extends CommonUserstate> extends EventBase {
    readonly context: T;
}

export interface JoinEvent extends EventBase {
    readonly type: 'join';
}

export interface LeaveEvent extends EventBase {
    readonly type: 'leave';
}

export interface ChatMessage extends EventBaseWithContext<ChatUserstate>, UserInfo {
    readonly type: 'message';
    readonly message: string;
}

export interface CheerMessage extends EventBaseWithContext<ChatUserstate>, UserInfo {
    readonly type: 'cheer';
    readonly message: string;
    readonly amount: number;
}

export interface CommandMessage extends EventBaseWithContext<ChatUserstate>, UserInfo {
    readonly type: 'command';
    readonly command: string;
    readonly message: string;
}

export interface PointsMessage extends EventBaseWithContext<ChatUserstate>, UserInfo {
    readonly type: 'redeem';
    readonly rewardType: string;
}

export interface RaidedMessage extends EventBase {
    readonly type: 'raided';
    readonly viewers: number;
}

export type AllEventTypes = ChatMessage | CheerMessage | CommandMessage | PointsMessage
    | JoinEvent | LeaveEvent | RaidedMessage;
