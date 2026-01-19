import { Process } from '../core/Process';
import Tower from '../managers/structures/tower';
import Link from '../managers/structures/link';
// import Lab from '../managers/structures/labLogic/index'; 
// import PowerSpawn from '../managers/structures/powerSpawn';
// import observer from '../managers/structures/observer';
import TerminalManager from '../managers/structures/terminal';
// import Nuker from '../managers/structures/nuker';
import SpawnManager from '../managers/structures/spawnLogic/index';

export class StructureProcess implements Process {
    public run(): void {
        for (const roomName in Game.rooms) {
            const room = Game.rooms[roomName] as any;
            if (room.controller && room.controller.my) {
                try {
                    if (room.link && room.link.length > 0) Link.run(roomName);
                    if (room.tower && room.tower.length > 0) Tower.run(roomName);
                    if (room.terminal) TerminalManager.run(roomName);
                    // if (room.lab && room.lab.length > 0) Lab.run(roomName);
                    // if (room.powerSpawn) PowerSpawn.run(room.powerSpawn);
                } catch (e) {
                    console.log(`Error running structures for ${roomName}:`, e);
                }
            }
        }
        SpawnManager.run();
    }
}
