import * as SerialPort from 'serialport';
import { PromWrap } from '../utils/utils';
import { getCurrentSettings } from '../settings/settings';
import { logError, logSuccess } from '../utils/log';

let port: SerialPort;

async function connectToNerf() {
    const { nerf } = getCurrentSettings();

    const prom = new PromWrap();

    port = new SerialPort(nerf.port, {
        baudRate: 9600,
    }, (err) => {

        if (err) {
            logError('Failed to connect to Nerf board', err);
            prom.reject(err);
        } else {
            logSuccess('Connected to Nerf Board');
            prom.resolve();
        }

    });

    return prom;

}

async function fireDart() {
    const prom = new PromWrap();

    port.write('1', (err) => {
        if (err) {
            logError('Failed fire dart', err);
            prom.reject(err);
        } else {
            logSuccess('PEW! PEW! PEW!');
            prom.resolve();
        }

    });

    return prom;
}

export default {

    start: async () => {
        return connectToNerf();
    },

    fire: async () => {
        return fireDart();
    }
};
