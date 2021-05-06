
import hub from './hub';

(async () => {
    const stdin = process.openStdin();

    await hub.start(true);

    stdin.on('data', data => {
        hub.sendIPC(data, true);
    });

})();
