import Tower from '@/structure/tower';
import Link from '@/structure/Link';
import Lab from '@/structure/Lab';
import PowerSpawn from '@/structure/powerSpawn';
import observer from '@/structure/observer';
import TerminalManager from '@/structure/terminal';
import Nuker from '@/structure/nuker';
import SpawnManager from '@/structure/Spawn/spawnManager';

export function runStructure() {
    // Iterate over all visible rooms that we own
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];
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
