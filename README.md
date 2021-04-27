# lego-my-candy

## Getting started

1. Ensure you have Node.js version 12 or later installed
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

If the file `app.settings.json` does not already exist in this directory, create the file, then copy and paste the following into it. 

This file contains confidential information. It will not leave your PC, and you should not show its contents to anyone else.

```json
{
    "channel": "",
    "identity": {
        "username": "",
        "password": "",
        "clientId": ""
    },
    "obsWebsocket":{
        "address": "",
        "password": "",
    },
    "arrivalNotifications": [
        {
            "username": "",
            "sourceName": "",
            "durationInSeconds": 0
        }
    ],
    "commandTriggers": []
}
```
The `channel` property is the channel you want to connect to. It does not have to be your own.

In `identitiy`, `username` needs to be your own. To get the `clientId` and `password` information, follow these steps:

#### Client ID

Go to https://dev.twitch.tv/console/apps

1. Click **Register Your Application** button
2. Name: Type any name
3. URL: http://localhost
4. Category: Chat Bot
5. Click **Create** button
   
You should see a **Client ID** token. 

#### OAuth token for password

Go to https://twitchapps.com/tmi/

1. Click Connect
2. Authorize TMI with Twitch, if prompted

You should see a text field starting with "oauth:". Copy the entire text, this is your password.

### OBS Websocket

In your `app.settings.json` file, fill in the `address` and `password` fields. 

`address` will likely just be `localhost:4444` as long as you haven't changed the default settings.

### Arrival Notifications

In your `app.settings.json` file, add settings for each user you wish to have notifications for.

`username` is the case-insensitive name of the user on Twitch.

`sceneName` is the name of the scene in OBS which has the `sourceName` to be toggled.

`sourceName` is the name of the source in OBS which will be turned on, and then off.

`durationInSeconds` is how long to keep the source active for, in seconds.

#### Example

```json

"arrivalNotifications": [
    {
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

The following are optional properties

| Property             | Description                                                                                                        |
|----------------------|--------------------------------------------------------------------------------------------------------------------|
| disabled             | If true, the command will be disabled                                                                              |
| restrictions         | Restricts who can issue the command. See **User Permissions** for info                                             |
| delayBetweenCommands | A buffer between executions of the same command, in seconds.                                                       |
| ignoreDuplicates     | If true, it will ignore commands issued while there is either a command actively playing, or queued to be executed |


```json
"commandTriggers": [
    {
        "command": "test",
        "restrictions": {
            "moderator": true,
        },
        "delayBetweenCommands": 10,
        "ignoreDuplicates": true,
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

| Property             | Description                                                                                                        |
|----------------------|--------------------------------------------------------------------------------------------------------------------|
| disabled             | If true, the command will be disabled                                                                              |


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

| Property             | Description                                                                                                        |
|----------------------|--------------------------------------------------------------------------------------------------------------------|
| disabled             | If true, the command will be disabled                                                                              |


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

### Audio

Will play audio locally. 

```json
{
    "type": "audio",
    "filename": "c:/folder/file.ogg"
}
```

### OBS

Will toggle the visibility of a scene in OBS

```json
{
    "type": "obs",
    "sourceName": "Source",
    "sceneName": "Image 1",
    "durationInSeconds": 10
}
```

### Chat

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

