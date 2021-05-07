# lego-my-candy

## Getting started

1. Ensure you have Node.js version 14 or later installed
   1. https://nodejs.org/en/download/
2. Optionally, install VSCode for easier editing
   1. https://code.visualstudio.com/download
3. Run the command `npm ci` in this directory to install the necessary packages. This may take a few minutes
4. Follow the steps in the **App Settings** section
5. Install the `ffplay` binary. See the **Audio Requirement** section
6. Run `npm run start` to begin the script
7. Press `CTRL+C` to exit

## Audio Requirement

In order to play audio, you will need to download a binary file for this application to use. 

1. Go to https://www.gyan.dev/ffmpeg/builds/
2. Scroll down to the **Release** section
3. Download the file that ends with `ffmpeg-release-essentials.7z`
   1. if you don't have 7-Zip installed, download the one ending in `.zip` instead of `.7z`
4. Create a file in this folder called `.bin`
5. Extract the file `ffplay.exe` from the `ffmpeg-4.4-essentials_build/bin` folder, into the `.bin` folder


## App Settings

When running the application either for the first time ever, or first time after an update, the settings file will be evaluated. If the file is lacking in settings, it will be updated with placeholder information, a warning message will be displayed, and the app will exit. If this happens, please update the settings according to the following sections.

This file contains confidential information. It will not leave your PC, and you should not show its contents to anyone else.

| Property             | Description                                                                           |
| -------------------- | ------------------------------------------------------------------------------------- |
| channel              | The Twitch channel name to connect to                                                 |
| identity             | Your identity to use when connecting to the Twitch channel for **chat** functionality |
| pubsub               | Credentials to use for Twitch PubSub notifications of Bits, Points, and Subs.         |
| streamElements       | StreamElements API token. Currently not used.                                         |
| obsWebsocket         | Websocket connection info for OBS functionality                                       |
| arrivalNotifications | Notifications when certain users arrive in chat                                       |
| commandTriggers      | Scenes to trigger when certain commands are issued in chat                            |
| bitTriggers          | Scenes to trigger when bit cheers happen                                              |
| pointTriggers        | Scenes to trigger when point redemptions happen                                       |
| counter              | Configuration for a counter. See **Using a Counter** for more info                    |


#### Identity

##### Client ID

Go to https://dev.twitch.tv/console/apps

1. Click **Register Your Application** button
2. Name: Type any name
3. URL: http://localhost
4. Category: Chat Bot
5. Click **Create** button
   
You should see a **Client ID** token. 

##### OAuth token for password

Go to https://twitchapps.com/tmi/

1. Click Connect
2. Authorize TMI with Twitch, if prompted

You should see a text field starting with "oauth:". Copy the entire text, this is your password.

### PubSub

1. Go to https://twitchtokengenerator.com/
2. Under Helix, toggle Yes for these 
   1. `bits:read`
   2. `chat:read`
   3. `channel:read:redemptions`
   4. `channel:read:subscriptions`	
3. Click the green **Generate Token!** button. 
4. Authenticate with Twitch. 
5. Copy the Access Token, Refresh Token, and Client Id. 
6. Paste those values into the appropriate config fields


### OBS Websocket

In your `app.settings.json` file, fill in the `address` and `password` fields. 

`address` will likely just be `localhost:4444` as long as you haven't changed the default settings.

### Arrival Notifications

In your `app.settings.json` file, add settings for each user you wish to have notifications for.

| Property          | Description                                                            |
| ----------------- | ---------------------------------------------------------------------- |
| disabled          | if true, this arrival notification will not be activated               |
| username          | the case-insensitive name of the user on Twitch.                       |
| sceneName         | the name of the scene in OBS which has the `sourceName` to be toggled. |
| sourceName        | the name of the source in OBS which will be turned on, and then off.   |
| durationInSeconds | is how long to keep the source active for, in seconds.                 |

#### Example

```json

"arrivalNotifications": [
    {
        "disabled": true,
        "username": "UserA",
        "sceneName": "Scene",
        "sourceName": "Image1",
        "durationInSeconds": 5
    },
    {
        "username": "UserB",
        "sceneName": "Scene",
        "sourceName": "Image2",
        "durationInSeconds": 15
    }
]

```
### Command Triggers

In your `app.settings.json` file, add settings for each command you wish to activate a scene for.

See the "What is a Scene" section for more information about the individual tasks that comprise a scene.

With a command trigger, you will need to supply the `command` which triggers it. This command will be issues in chat like `!command Hello!` though when writing your rule, exclude the leading exclamation point as well as any text after the command.

The `command` text can be empty if you wish to drive this command by local keyboard presses only. If this case, add the `key` property (See **Key Shortcuts**) and leave the `command` property as an empty string (`"command": ""`)

The `command` text can only be alphanumeric characters with no spacing. `ABCabc123` is acceptable for a command, though keep in mind that we evaluate the command as lowercase for matching. So `ABCabc123` is the same as `abcabc123` and if you have multiple entries with the same command text, only the first will be ran.

The following are optional properties

| Property     | Description                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| disabled     | If true, the command will be disabled                                                                 |
| restrictions | Restricts who can issue the command. See **User Permissions** for info                                |
| cooldown     | A cooldown, in seconds. Subsequent similar commands issued during a cooldown period will be rejected. |
| key          | If provided, this keypress will execute the action. See **Key Shortcuts** for important info.         |


```json
"commandTriggers": [
    {
        "command": "test",
        "restrictions": {
            "moderator": true,
        },
        "cooldown": 10,
        "directives": [
            {
                "type": "chat",
                "message": "Hello, {{username}}"
            },
            {
                "type": "chat",
                "delayInSeconds": 3,
                "message": "Goodbye, {{username}}"
            },
            {
                "type": "audio",
                "filename": "c:/temp/file_example_OOG_1MG.ogg"
            },
            {
                "type": "obs",
                "durationInSeconds": 3,
                "sceneName": "Scene",
                "sourceName": "Image"
            }
        ]
    }
]
```

The above command trigger will: 
1. Trigger when `!test` is issued in chat
2. Be available for moderators only
3. Will be rejected if there's another command like this queued
4. Will wait until at least 10 seconds after the last command of this type ran
5. When executed, will immediately 
   1. say "Hello, user" in chat
   2. start playing the audio file
   3. turn on the "Image" source in OBS
6. Then, 3 seconds later
   1. say "Goodbye, user" in chat
   2. turn off the "Image" source in OBS
   

If the audio clip is longer than 3 seconds, the trigger will not conclude until it has finished playing.

### Bits Commands

In your `app.settings.json` file, add settings for each command you wish to activate a scene for.

See the "What is a Scene" section for more information about the individual tasks that comprise a scene.

With a bit trigger, you will need to supply the `minAmount` which triggers it. The trigger with the highest `minAmount` which the bit cheer passes will be used. 

The following are optional properties

| Property | Description                                                                                   |
| -------- | --------------------------------------------------------------------------------------------- |
| disabled | If true, the command will be disabled                                                         |
| key      | If provided, this keypress will execute the action. See **Key Shortcuts** for important info. |

```json
"bitTriggers": [
    {
        "minAmount": 0,
        "directives": [
            {
                "type": "chat",
                "message": "{{username}} cheered {{amount}} bits"
            }
        ]
    }
]
```

### Points Commands

In your `app.settings.json` file, add settings for each command you wish to activate a scene for.

See the "What is a Scene" section for more information about the individual tasks that comprise a scene.

With a point trigger, you will need to supply the `rewardTitle` which triggers it. Casing does not matter, but it should otherwise be the complete title.

The following are optional properties

| Property | Description                                                                                   |
| -------- | --------------------------------------------------------------------------------------------- |
| disabled | If true, the command will be disabled                                                         |
| key      | If provided, this keypress will execute the action. See **Key Shortcuts** for important info. |

```json
"pointTriggers": [
    {
        "rewardTitle": "Posture Check!",
        "directives": [
            {
                "type": "chat",
                "message": "{{username}} redeemed {{rewardTitle}}"
            }
        ]
    }
]
```

### Key Shortcuts

For Chat, Bit, and Point commands, you can invoke them with a single keyboard key. When these commands are ran via keypress, they are added to the queue without regard for delay timing, user restrictions, or any other specific restrictions. 

The message replacement strings for `username` will always be the name of the `channel` from the settings file.

For a list of key names to use in your settings file, please look at `./keys/mappings.ts`. You need to use the right-side text, as-is, in your configuration.

If you have multiple active commands with the same key, they will all be queued. Order of queueing is not guaranteed.

```json
{
    "key": "Page Up",
    "directive": []
}
```

If you have trouble with finding a key in the `mappings.ts` file, you can run `npm run keys:debug` which will start a listener for keypresses. Press the key you wish to use. The numeric code and the mapping text (if available) will be shown.

### User Permissions

For features which can be restricted by the user's information. 

```json
{
    "broadcaster": true,
    "moderator" : true,
    "subscriber" : true,
    "vip": true
}
```

| User Is     |  VIP  | Subscriber | Moderator | Broadcaster | Regular |
| ----------- | :---: | :--------: | :-------: | :---------: | :-----: |
| Broadcaster |   O   |     O      |     O     |      O      |    O    |
| Moderator   |   O   |     O      |     O     |             |    O    |
| Subscriber  |       |     O      |           |             |    O    |
| VIP         |   O   |            |           |             |    O    |
| Regular     |       |            |           |             |    O    |


### What is a Scene?

This is not referring to an OBS scene, but rather a grouping of tasks to be performed, using the available functionality of this app. You will use these scenes as reactions to events like commands, bits, and cheers.

The following task types are available. 

All tasks in a scene will execute at the same time. You can specify the optional `delayInSeconds` property in any task to delay its execution.

#### Audio

Will play audio locally. 

```json
{
    "type": "audio",
    "filename": "c:/folder/file.ogg"
}
```

If you provide an array of files in the `filename` property, one of the files will be played at random

```json
{
    "type": "audio",
    "filename": [ "c:/folder/file.ogg", "c:/folder/file2.ogg" ]
}
```

#### OBS

Will toggle the visibility of a scene in OBS

```json
{
    "type": "obs",
    "sourceName": "Image-1",
    "sceneName": "Main",
    "durationInSeconds": 10
}
```

If you provide an array of source names in the `sourceName` property, one of the sources will be used at random

```json
{
    "type": "obs",
    "sourceName": ["Image-1", "Image-2"],
    "sceneName": "Main",
    "durationInSeconds": 10
}
```

#### Chat

Will send a message to chat. The message text can contain replacements for certain variables. 

The following variables are currently available

| Token        | Description                                    |
| ------------ | ---------------------------------------------- |
| {{username}} | Replaced with the user who triggered the event |

```json
{
    "type": "chat",
    "message": "Hello, {{username}}. I love you."
}
```

#### Motor

Will start and stop the motor on a connected Lego Hub.

```json
{
    "type": "motor",
    "power": 100,
    "durationInSeconds": 3.5
}
```

#### Counter

Changes the current counter value by the number specified. 

```json
{
    "type": "counter",
    "change": 1
}
```

To decrement, use a negative number.

```json
{
    "type": "counter",
    "change": -10
}
```

### Using a Counter

To use a counter, first add some basic information to the `app.settings.json` file's `counter` setting. 

| Property        | Description                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| sourceDirectory | The directory to store the "database" or counts, and the overlay text file for OBS                        |
| gameId          | The name of the game being played                                                                         |
| text            | (Optional) Text to write to the OBS overlay file. Can use the token `{{count}}` to replace with the count |
| disabled        | (Optional) If true, will disable this section                                                             |

This counter will store a JSON file and a text file in the `sourceDirectory` folder. When starting the app, changing the `gameId` or the `disabled` properties, the contents of the JSON file will be read to find a matching entry for `gameId`. Case matters, so please reference that file if you've forgotten the game id.

Reference the **Counter** scene above for how to add the incrememnt / decrement to a command.

### Stream Elements

This isn't really used yet (and may not be used ever), but the bones of using their API are in place. Don't bother with this section until/unless it's implemented in this project.

To get your token:
1. Log into Stream Elements web app
2. Go to your account page ( https://streamelements.com/dashboard/account/channels )
3. Toggle `Show secrets` 
4. Copy the contents of the `JWT token`
   
You can add that token the the `app.settings.json` file as such:

```json
"streamElements": {
    "token": ""
},
```

