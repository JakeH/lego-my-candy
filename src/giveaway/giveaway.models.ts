
export interface GiveawaySettings {
    /**
     * The command to react to in chat
     */
    command: string;

    /**
     * Whisper that will be sent to the viewer when
     * their entry has been accepted
     */
    entryWhisper: string;

    /**
     * General chat message sent, addressed to the user who
     * we've failed to send a whisper to
     */
    whisperFailMessage: string;

    /**
     * Whisper sent to the winner
     */
    wonWhisper: string;

    /**
     * Message sent to general chat announcing the winner
     */
    wonChatMessage: string;

    /**
     * Message sent to general chat periodically while event is active
     */
    periodicActiveChatMessage: string;

    /**
     * Interval to send periodic chat message while event is active
     */
    periodicActiveChatIntervalInMinutes: number;

    /**
     * Message sent to general chat periodically while event is inactive
     */
    periodicInactiveChatMessage: string;

    /**
     * Interval to send periodic chat message while event is inactive
     */
    periodicInactiveChatIntervalInMinutes: number;

    /**
     * Minimum number of users needed to start event
     */
    minEntriesToStart: number;

    /**
     * How long the event should be active before
     * deciding a winner
     */
    eventLengthInMinutes: number;
}
