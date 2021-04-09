# lego-my-candy

## App settings

If the file `app.settings.json` does not already exist in this directory, create the file, then copy and paste the following into it. 

This file contains confidential information. It will not leave your PC, and you should not show its contents to anyone else.

```json
{
    "$schema": "./app.settings.schema.json",
    "channel": "",
    "identity": {
        "username": "",
        "password": "",
        "clientId": ""
    }
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
2. After authenticating with Twitch...

You should see a text field starting with "oauth:". Copy the entire text, this is your password.



