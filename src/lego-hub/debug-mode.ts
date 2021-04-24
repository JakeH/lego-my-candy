import * as inq from 'inquirer';
import { BaseHub } from 'node-poweredup';
import { take } from 'rxjs/operators';
import legoHub from './lego-hub';
import { DevicePorts } from './lego-hub.models';

enum MainMenu {
    info = 'Hub Info',
    move = 'Move Motor',
    exit = 'Exit'
}

let hub: BaseHub;

function main() {

    const mainMenu: inq.DistinctQuestion = {
        type: 'list',
        name: 'selection',
        message: 'What should we do',
        choices: [
            MainMenu.info,
            MainMenu.move,
            MainMenu.exit,
        ],
    };

    inq.prompt(mainMenu).then(answer => {
        const { selection } = answer;

        switch (selection) {
            case MainMenu.info:
                console.log(hub);
                main();
                break;

            case MainMenu.move:
                moveMotor();
                break;

            case MainMenu.exit:
                process.exit(0);
        }

    });
}

function moveMotor() {
    const portsList: DevicePorts[] = ['A', 'B', 'C', 'D'];
    const movePrompts: inq.DistinctQuestion[] = [
        {
            type: 'list',
            name: 'port',
            message: 'Port?',
            choices: portsList,
            default: portsList[0],
        },
        {
            type: 'number',
            name: 'power',
            message: 'Power?'
        },
        {
            type: 'number',
            name: 'durationInSeconds',
            message: 'Seconds?',
        }
    ];

    inq.prompt(movePrompts).then(answer => {
        const { port, power, durationInSeconds } = answer;

        console.log(port, power, durationInSeconds);

        legoHub.moveMotor(hub.name, {
            durationInSeconds,
            port,
            power,
        }).then(() => {
            main();
        });

    });

}

(async () => {

    console.log('waiting for hubs');

    legoHub.hubDiscoveryStream().pipe(
        take(1),
    ).subscribe(h => {
        hub = h;
        main();
    });

    legoHub.start();

})();
