# lego-my-candy

## Getting started

1. Ensure you have Node.js version 12 or later installed
   1. https://nodejs.org/en/download/
2. Optionally, install VSCode for easier editing
   1. https://code.visualstudio.com/download
3. Run the command `npm ci` in this directory to install the necessary packages. This may take a few minutes
4. Follow the steps in the **App Settings** section
5. Run `npm run start` to begin the script
6. Press `CTRL+C` to exit

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
    ]
}
```
The `channel` property is the channel you want to connect to. It does not have to be your own.

In `identitiy`, `username` needs to be your own. To get the `clientId` and `password` information, follow these steps:

### Client ID

Go to https://dev.twitch.tv/console/apps

1. Click **Register Your Application** button
2. Name: Type any name
3. URL: http://localhost
4. Category: Chat Bot
5. Click **Create** button
   
You should see a **Client ID** token. 

### OAuth token for password

Go to https://twitchapps.com/tmi/

1. Click Connect
2. Authorize TMI with Twitch, if prompted

You should see a text field starting with "oauth:". Copy the entire text, this is your password.


## OBS Websocket

In your `app.settings.json` file, fill in the `address` and `password` fields. 

`address` will likely just be `localhost:4444` as long as you haven't changed the default settings.

## Arrival Notifications

In your `app.settings.json` file, add settings for each user you wish to have notifications for.

`username` is the case-insensitive name of the user on Twitch.

`sourceName` is the name of the source in OBS which will be turned on, and then off.

`durationInSeconds` is how long to keep the source active for, in seconds.

### Example

```json

    "arrivalNotifications": [
        {
            "username": "UserA",
            "sourceName": "Image1",
            "durationInSeconds": 5
        },
        {
            "username": "UserB",
            "sourceName": "Image2",
            "durationInSeconds": 15
        }
    ]

```

