export type DevicePorts = 'A' | 'B' | 'C' | 'D';

export interface MotorMovementDirective {
    /**
     * The port which the motor is attached to 
     */
    port: DevicePorts;

    /**
     * The power and directionality. 
     * 
     * 1 - 100 or -1 - -100
     */
    power: number;

    /**
     * The duration, in seconds, to keep the motor on
     */
    durationInSeconds: number;
}
