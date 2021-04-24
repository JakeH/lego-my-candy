import PoweredUP, { BaseHub, BasicMotor } from 'node-poweredup';
import { Subject } from 'rxjs';
import { MotorMovementDirective } from './lego-hub.models';

const poweredUp = new PoweredUP();

const hubs$ = new Subject<BaseHub>();

poweredUp.on('discover', async (hub: BaseHub) => {
    console.log(`Discovered ${hub.name}!`);

    // Connect to the Hub
    await hub.connect();

    hubs$.next(hub);
});

/**
 * Moves a motor according to a movement directive
 * 
 * @param hubName 
 * @param directive 
 * @returns 
 */
async function moveMotor(hubName: string, directive: MotorMovementDirective) {

    const [hub] = poweredUp.getHubsByName(hubName);
    if (!hub) {
        console.error(`Could not find hub ${hubName}`);
        return;
    }

    const {durationInSeconds, port, power} = directive;

    const motor = await hub.waitForDeviceAtPort(port) as BasicMotor;

    await motor.setPower(power);
    await hub.sleep(durationInSeconds * 1000);
    await motor.brake();

}

export default {

    /**
     * Begins the scan for hub discovery
     */
    start: async () => {
        poweredUp.scan();
    },

    /**
     * Stops hub discovery
     */
    stop: async () => {
        poweredUp.stop();
    },

    /**
     * Emits when a new hub is discovered and is connected to
     */
    hubDiscoveryStream: () => hubs$,

    /**
     * Returns the first hub with the matching name
     * 
     * @param name The hub name
     */
    getHubByName: (name: string) => poweredUp.getHubsByName(name)[0],

    moveMotor,
};
