# Giveaway

It's possible to automate the giveaway process, with winners able to receive their redemption keys via Twitch Whisper.


## Key File Setup

You will need to create a file which contains a list of the games and redemption keys. The format of the file is very important! 

1. Create a file in /assets/ called "giveaway-source.txt" 
2. Add the items in the following format

[name]
[key]
[blank space]

For example
```
Watch-It
ABC-DEF-GHI

Sea of Pirates
ABC-DEF-GHI

```

The [name] will be used in private and public communication, while the [key] is only ever sent to the winner.

## Settings

| Setting | Purpose | Tokens |
|---|---|---|
| command | Chat command used to enter giveaway |  |
| entryWhisper | Whisper sent to viewer upon successful entry |  |
| whisperFailMessage | General chat message addressed to viewer when whisper failed | username |
| wonWhisper | Whisper message sent to winner | name, key |
| wonChatMessage | General chat message announcing the winner and game name | username, name (the game name) |
| periodicActiveChatMessage | General chat message when the giveaway is active (enough viewers entered, countdown starts) | count (number of viewers entered), remaining (time in minutes) |
| periodicActiveChatIntervalInMinutes | Interval in minutes to display the active chat message |  |
| periodicInactiveChatMessage | General chat message when the giveaway is not active | count (number of viewers entered), min (number of entries required to start) |
| periodicInactiveChatIntervalInMinutes | Interval in minutes to display the inactive chat message |  |
| minEntriesToStart | Minimum number of entries for giveaway to become active |  |
| eventLengthInMinutes | How long an active giveaway lasts before picking a winner |  |


## Starting / Stopping the giveaway

In the terminal, type "giveaway start" to begin and "giveaway stop" to end. 

Restarting the software will stop the giveaway, but will not start it back up. 

## Series of events

### Inactive Mode

1. Giveaway is started in terminal
2. The **periodicInactiveChatMessage** is displayed in general chat. 
   1. This message repeats every **periodicInactiveChatIntervalInMinutes** while the event is not active

### Viewer Attempts Entry Event

1. Viewer A issues **command** to join event
   1. A whisper with **entryWhisper** is sent to the viewer
      1. If the whisper fails, **whisperFailMessage** is sent to general chat
      2. If the whisper succeeds, viewer is entered into the giveaway
   2. If **minEntriesToStart** is met or exceeded, the event enters **Active Mode** if not already active

### Active Mode

1. The **periodicActiveChatMessage** is displayed in general chat. 
   1. This message repeats every **periodicActiveChatIntervalInMinutes** while the event is active
2. After **eventLengthInMinutes** has elapsed, a winner and game are both choosen at random
   1. **wonWhisper** is sent to the viewer via whispers
   2. **wonChatMessage** is sent to general chat
   3. The event goes back to **Inactive Mode**
      