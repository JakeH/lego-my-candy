
import nerf from './nerf';

(async () => {

    const stdin = process.openStdin();

    await nerf.start();

    stdin.on('data', data => {
        nerf.fire();
    });

})();
