# Lego Hub 

## Test

Run `npm run hub:debug`

You should see some `RECV:` messages as the connection happens. If you see a `Lego Hub connected` message, then you should be good to start testing.

You can type directly into the terminal to send messages. 

`motor.A.10` will send a signal to run the `motor` on port `A` to power `10`. 

`motor.A.0` will stop

`motor.A.-10` will spin in the opposite direction.

The power needs to be between -100 and 100.

To exit, please type `exit`

There is a log file in `.bin/hub/log.txt`.

No other meaningful integration work (bits, points) has been done.
