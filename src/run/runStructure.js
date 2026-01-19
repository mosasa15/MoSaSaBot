import Tower from '@/structure/tower';
import Link from '@/structure/Link';
import Lab from '@/structure/Lab';
import PowerSpawn from '@/structure/powerSpawn';
import observer from '@/structure/observer';
import TerminalManager from '@/structure/terminal';
import Nuker from '@/structure/nuker';
import SpawnManager from '@/structure/Spawn/spawnManager';

export function runStructure() {
    // const powerSpawnIds = ['66ba2568af515e4e2eeb0736','671b23387dd1461439874c34','671b2a4d4823ba477c496404','670f7643e753d22f78042225']; 
    // powerSpawnIds.forEach(powerSpawnId => {  
    //     const powerSpawn = Game.structures[powerSpawnId];  
    //     if (powerSpawn) {
    //         PowerSpawn.run(powerSpawn);  
    //     } 
    // });

    const rooms = ['E54N19','E53N19','E55N21','E56N13','E56N17','E55N9','E58N14','E53N1'];
    rooms.forEach(roomName => {
        Link.run(roomName);
        Tower.run(roomName);
        //PowerSpawn.run(roomName);  
        TerminalManager.run(roomName);
        //Lab.run(roomName);  
    });
    //Tower.run('E53N1');
    //Nuker.run();

    SpawnManager.run();
    // const room = ['E58N14','E56N17','E56N13','E53N19','E55N21','E54N19'];
    // room.forEach(roomName => {
    //     TerminalManager.run(roomName);
    // });

    // const labIds = ['E54N19','E55N21','E53N19','E56N13','E56N17']; 
    // labIds.forEach(roomName => {  
    //     Lab.run(roomName);  
    // });
    
    // const room_power = ['E54N19'];
    // room_power.forEach(roomName => {
    //     observer.run(roomName)
    // });
}