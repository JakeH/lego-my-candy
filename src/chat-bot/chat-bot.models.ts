import { ChatUserstate, CommonUserstate } from 'tmi.js';

export type EventType = 'message' | 'command' | 'redeem' | 'cheer' | 'join' | 'leave';

interface EventBase {
    readonly type: EventType;
    readonly username: string;
    readonly sent: Date;
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

export interface ChatMessage extends EventBaseWithContext<ChatUserstate> {
    readonly type: 'message';
    readonly message: string;
}

export interface CheerMessage extends EventBaseWithContext<ChatUserstate> {
    readonly type: 'cheer';
    readonly message: string;
    readonly amount: number;
}

export interface CommandMessage extends EventBaseWithContext<ChatUserstate> {
    readonly type: 'command';
    readonly command: string;
    readonly message: string;
}

export interface PointsMessage extends EventBaseWithContext<ChatUserstate> {
    readonly type: 'redeem';
    readonly rewardType: string;
}

export type AllEventTypes = ChatMessage | CheerMessage | CommandMessage | PointsMessage
    | JoinEvent | LeaveEvent;
