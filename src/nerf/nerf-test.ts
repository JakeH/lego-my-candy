
import nerf from './nerf';
import * as SerialPort from 'serialport';

(async () => {

    const ports = await SerialPort.list();
    console.log(ports.map(p => `${p.path} ${p.manufacturer}`));

    const stdin = process.openStdin();

    await nerf.start();

    stdin.on('data', data => {
        nerf.fire();
    });

})();
