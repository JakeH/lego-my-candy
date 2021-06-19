import * as SerialPort from 'serialport';
import { PromWrap } from '../utils/utils';
import { getCurrentSettings } from '../settings/settings';
import { logError, logSuccess, logWarn } from '../utils/log';

let port: SerialPort;

async function connectToNerf() {
    const { nerf } = getCurrentSettings();

    if (nerf.disabled) {
        logWarn('Nerf is disabled in settings');
        return Promise.resolve();
    }

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

    return prom.toPromise();

}

async function fireDart() {

    const prom = new PromWrap();

    if (port && port.isOpen) {
        port.write('1', (err) => {
            if (err) {
                logError('Failed fire dart', err);
                prom.reject(err);
            } else {
                logSuccess('PEW! PEW! PEW!');
                prom.resolve();
            }

        });
    } else {
        logError('Nerf Port is not established or open');
        prom.reject(new Error('Nerf Port is not established or open'));
    }

    return prom.toPromise();
}

export default {

    start: connectToNerf,
    fire: fireDart,
};
