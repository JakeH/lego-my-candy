
export interface GiveawaySettings {
    command: string;
    entryWhisper: string;

    eventStartedChatMessage: string;

    wonWhisper: string;

    wonChatMessage: string;
    periodicChatMessage: string;

    periodicChatIntervalInMinutes: number;

    minEntriesToStart: number;
    eventLengthInMinutes: number;
}
