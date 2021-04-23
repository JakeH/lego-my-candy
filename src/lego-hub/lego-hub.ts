import PoweredUP, { BasicMotor, Hub } from 'node-poweredup';

// TODO: 
// Create profile for speed and duration based on bit / point amounts
// { duration: 3000, speed: 50, bits: 10, points: 100 }

const poweredUp = new PoweredUP();

poweredUp.on('discover', async (hub: Hub) => {
    console.log(`Discovered ${hub.name}!`);

    // Connect to the Hub
    await hub.connect();

    // const motorA = await hub.waitForDeviceAtPort('A') as BasicMotor; // Make sure a motor is plugged into port A
    // const motorB = await hub.waitForDeviceAtPort('B') as BasicMotor; // Make sure a motor is plugged into port B
    // console.log('Connected');

    // while (true) { // Repeat indefinitely
    //     console.log('Running motor B at speed 50');
    //     motorB.setPower(50); // Start a motor attached to port B to run a 3/4 speed (75) indefinitely
    //     console.log('Running motor A at speed 100 for 2 seconds');
    //     motorA.setPower(100); // Run a motor attached to port A for 2 seconds at maximum speed (100) then stop
    //     await hub.sleep(2000);
    //     motorA.brake();
    //     await hub.sleep(1000); // Do nothing for 1 second
    //     console.log('Running motor A at speed -30 for 1 second');
    //     motorA.setPower(-30); // Run a motor attached to port A for 2 seconds at 1/2 speed in reverse (-50) then stop
    //     await hub.sleep(2000);
    //     motorA.brake();
    //     await hub.sleep(1000); // Do nothing for 1 second
    // }
});

poweredUp.scan();
