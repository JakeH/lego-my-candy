import * as ioHook from 'iohook';
import { KEYBOARD_MAPPING } from './mappings';

ioHook.start();

ioHook.on('keydown', ({ keycode }) => {
    console.log(keycode, KEYBOARD_MAPPING[keycode]);
});

console.log('Press any key to see its code');

(function wait() {
    if (true) { setTimeout(wait, 1000); }
})();
